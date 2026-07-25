const cameraButton = document.getElementById("cameraButton");
const cameraInput = document.getElementById("cameraInput");
const preview = document.getElementById("preview");
const result = document.getElementById("result");

cameraButton.addEventListener("click", () => {
    cameraInput.click();
});


cameraInput.addEventListener("change", async (event) => {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const imageUrl = URL.createObjectURL(file);

    preview.src = imageUrl;
    preview.style.display = "block";


    // ここから自動AI解析
    await analyzeFood(file);

});


async function analyzeFood(file) {

    result.textContent = "AI解析中...";

    const imageBase64 = await fileToBase64(file);

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key="
      + GEMINI_API_KEY;


    const response = await fetch(url, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            contents: [
                {
                    parts: [
                        {
                            text: "この食事写真を解析してください。料理名を教えてください。"
                        },
                        {
                            inline_data: {
                                mime_type: file.type,
                                data: imageBase64
                            }
                        }
                    ]
                }
            ]

        })

    });


const data = await response.json();

console.log(data);

if (!response.ok) {
    result.textContent = data.error.message;
    return;
}

const text = data.candidates[0].content.parts[0].text;

result.textContent = text;

}


function roundCalories(calories) {
    return Math.round(calories / 25) * 25;
}

function fileToBase64(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => {
           const base64 = reader.result.split(",")[1];
           resolve(base64);
        };

        reader.onerror = reject;

        reader.readAsDataURL(file);

    });

}