chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GENERATE_TITLE") {
    generateTitle(msg.content)
      .then(sendResponse)
      .catch((err) => {
        console.error("Error generating title:", err);
        sendResponse({ error: err.message });
      });
    return true;
  }

  if (msg.type === "TRANSLATE_AND_GENERATE_TITLE") {
    translateAndGenerateTitle(msg.content)
      .then(sendResponse)
      .catch((err) => {
        console.error("Error translating and generating title:", err);
        sendResponse({ error: err.message });
      });
    return true;
  }
});

// Translate text using Google Translate API
async function translateText(text, sourceLang = "auto", targetLang = "en") {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // The API returns a complex array, we extract the translated text
    let translatedText = "";
    if (data && data[0]) {
      data[0].forEach((item) => {
        if (item[0]) {
          translatedText += item[0];
        }
      });
    }

    return translatedText;
  } catch (error) {
    console.error("Translation error:", error);
    return null;
  }
}

// Translate content and generate title
async function translateAndGenerateTitle(content) {
  try {
    // Step 1: Translate content first
    const translatedContent = await translateText(content);

    if (!translatedContent) {
      throw new Error("Translation failed");
    }

    // Step 2: Generate title with translated content
    const result = await generateTitle(translatedContent);

    return { title: result.title, translatedContent };
  } catch (error) {
    console.error("Error in translateAndGenerateTitle:", error);
    throw error;
  }
}

// Generate GitHub issue title using LLM API
async function generateTitle(content) {
  if (!CONFIG.OPENAI_API_KEY) {
    throw new Error("API key is empty. Configure OPENAI_API_KEY in config.js");
  }

  const apiUrl = CONFIG.LLM_API_URL;
  const payload = {
    model: CONFIG.LLM_MODEL,
    messages: [
      {
        role: "system",
        content: "You generate concise GitHub issue titles.",
      },
      {
        role: "user",
        content: `Generate a short, clear GitHub issue title (max 10 words, English):\n\n${content}`,
      },
    ],
    temperature: 0.3,
  };

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONFIG.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.text();

  if (!res.ok) {
    let errMsg = "Unknown error";
    try {
      const errJson = JSON.parse(data);
      errMsg = errJson.error?.message || JSON.stringify(errJson);
    } catch {
      errMsg = data;
    }
    throw new Error(`API Error (${res.status}): ${errMsg}`);
  }

  const jsonData = JSON.parse(data);
  const title = jsonData.choices?.[0]?.message?.content?.trim();

  if (!title) {
    throw new Error("Invalid API response");
  }

  return { title };
}
