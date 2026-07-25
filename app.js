const cameraButton = document.getElementById("cameraButton");
const cameraInput = document.getElementById("cameraInput");
const preview = document.getElementById("preview");
const result = document.getElementById("result");
const savePhotoButton = document.getElementById("savePhotoButton");

let capturedFile = null;

cameraButton.addEventListener("click", () => {
    cameraInput.click();
});


cameraInput.addEventListener("change", async (event) => {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    capturedFile = file;

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
                            text: "この食事写真の総カロリーを推定してください。数値だけを返してください。単位や説明文は不要です。"
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
const calories = Number(data.candidates[0].content.parts[0].text);

result.textContent = roundCalories(calories) + " kcal";

savePhotoButton.style.display = "block";

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

savePhotoButton.addEventListener("click", async () => {

    if (!capturedFile) {
        return;
    }

    const shareFile = new File(
        [capturedFile],
        "meal-photo.jpg",
        {
            type: capturedFile.type
        }
    );

    if (navigator.share && navigator.canShare({ files: [shareFile] })) {

        await navigator.share({
            files: [shareFile],
            title: "食事写真"
        });

    } else {

        alert("この端末では写真保存に対応していません");

    }

});