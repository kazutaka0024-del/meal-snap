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

    // Gemini API呼び出し

}


function roundCalories(calories) {
    return Math.round(calories / 25) * 25;
}