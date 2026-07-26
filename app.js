const cameraButton = document.getElementById("cameraButton");
const cameraInput = document.getElementById("cameraInput");
const preview = document.getElementById("preview");
const result = document.getElementById("result");
const savePhotoButton = document.getElementById("savePhotoButton");
const history = document.getElementById("history");

let capturedFile = null;
let isAnalyzing = false;

cameraButton.addEventListener("click", () => {

    if (isAnalyzing) {
        return;
    }

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

 try {

    isAnalyzing = true;
    cameraButton.disabled = true;

    result.textContent = "AI解析中...";


    const imageBase64 = await fileToBase64(file);

    const url =
       "https://meal-snap-api.kazutaka0024.workers.dev/";
  

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
                          text:
                            `
                            この食事写真を解析してください。
                            以下のJSON形式だけで返してください。

                            {
                             "food":"料理名",
                             "calories":数値
                            }

                            説明文は禁止です。
                            `
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

if (!response.ok) {

    result.textContent =
    data.error?.message || "APIエラー";

    cameraButton.disabled = false;
    isAnalyzing = false;

    return;

}

// Gemini回答チェック
if (!data.candidates) {

    console.log(data);

    result.textContent =
    "AI解析結果が取得できませんでした";

    cameraButton.disabled = false;
    isAnalyzing = false;

    return;

} 
 
let text = data.candidates[0].content.parts[0].text;

// Markdownコードブロック除去
text = text
.replace(/```json/g, "")
.replace(/```/g, "")
.trim();

const meal = JSON.parse(text);

const calories = roundCalories(meal.calories);

result.textContent =
meal.food + " : " + calories + " kcal";

saveMealHistory(
    meal.food,
    calories
);

loadHistory();

savePhotoButton.style.display = "block";

cameraButton.disabled = false;
isAnalyzing = false;

    } catch (error) {

        result.textContent = "エラー：" + error.message;

        cameraButton.disabled = false;
        isAnalyzing = false;

    }

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

function getMealType(){

 const hour =
 new Date().getHours();


 if(hour < 11){
    return "朝食";
 }

 if(hour < 16){
    return "昼食";
 }

 return "夕食";

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

function saveMealHistory(food, calories){

    const meals =
        JSON.parse(
            localStorage.getItem("meals") || "[]"
        );


    const now = new Date();


    meals.push({

        date:
        now.toISOString().slice(0,10),


        time:
        now.toTimeString().slice(0,5),


        mealType:
        getMealType(),


        food:
        food,


        calories:
        calories

    });


    localStorage.setItem(
        "meals",
        JSON.stringify(meals)
    );

}

function loadHistory(){

    console.log("loadHistory実行");

    const meals =
    JSON.parse(
        localStorage.getItem("meals") || "[]"
    );


    const dates =
    [...new Set(
        meals.map(m => m.date)
    )];


    // 古い順
    dates.sort();


    let html = "";


    dates.forEach(date => {


        const dayMeals =
        meals.filter(
            m => m.date === date
        );


        html += `
        <div class="day">

        <h3>
        📅 ${date}
        </h3>
        `;


        const types =
        ["朝食","昼食","夕食"];


        let dayTotal = 0;


        types.forEach(type=>{


            const list =
            dayMeals.filter(
                m => m.mealType === type
            );


            html +=
            `<h4>${type}`;


            if(list.length){

                let total = 0;


                list.forEach(meal=>{

                    total += meal.calories;


                    html +=
                    `
                    <p>
                    ・${meal.food}
                    ${meal.calories} kcal
                    </p>
                    `;

                });


                html +=
                `<b>合計 ${total} kcal</b>`;


                dayTotal += total;


            }else{

                html +=
                `
                <p>
                未登録
                </p>
                `;

            }


            html += "</h4>";

        });


        html +=
        `
        <hr>
        <strong>
        🔥 1日合計 ${dayTotal} kcal
        </strong>

        </div>
        `;


    });


    history.innerHTML = html;

}

alert("loadHistory呼び出し");
loadHistory();
