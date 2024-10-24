// public/script.js
document.getElementById('sendBtn').addEventListener('click', async () => {
    const userInput = document.getElementById('userInput').value;
    const responseContainer = document.getElementById('responseContainer');

    const response = await fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userMessage: userInput })
    });

    const data = await response.json();
    responseContainer.innerText += `\nBot: ${data.response}`;
    speak(data.response);
});

// Voice recognition for input
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
document.getElementById('voiceInputBtn').addEventListener('click', () => {
    recognition.start();
});

recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById('userInput').value = transcript;
    document.getElementById('sendBtn').click();
};

// For text-to-speech
function speak(text) {
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
}

// Optional: Speak the response from the bot
// Call speak(data.response) after receiving the response in the sendBtn click event
