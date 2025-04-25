let text;
let events = ["click", "keydown", "keyup", "mousedown", "mouseup", "wheel"];
const URI = "https://api.dictionaryapi.dev/api/v2/entries/en/";

//adding the font awesomecss inside the html
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"; // path to your CSS file
document.head.appendChild(link);

// Function to fetch meaning from the API
const getMeaning = async (word) => {
    let requestUrl = `${URI}${word}`;
    const response = await fetch(requestUrl);
    if (response.ok) {
        const data = await response.json();
        return data;
    }
    return 0;
};


// Function to get selected text from the page
let getSelectionText = () => {
    let text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    }
    return text;
};

// Trigger meaning fetch and popup creation on mouseup (text selection)
document.addEventListener("mouseup", async (e) => {
    text = getSelectionText();
    if (text) {
        let searchText = text.split(" ")[0];
        let response = await getMeaning(searchText);
        if (response) createPopUp(response[0], e.clientX, e.clientY);
        else notFoundPopUp(text, e.clientX, e.clientY);
    }
});

// Function to create popup with meaning info
function createPopUp(data, x, y) {

    console.log('====================================');
    console.log(data.phonetics); // gives available phonetics
    // but we need to find the one that has the audio url
    let audioUrl = checkAudioSource(data.phonetics)

    console.log('====================================');

    injectStyles();

    let previousBox = document.getElementById("popupBox");
    if (previousBox) {
        document.body.removeChild(previousBox);
    }

    let popupBox = document.createElement("div");
    popupBox.id = "popupBox";
    popupBox.classList.add("sabdartha-container");
    popupBox.style.top = `${y}px`;
    popupBox.style.left = `${x}px`;


    let wordSpan = document.createElement("span");
    wordSpan.innerText = data.word;
    popupBox.appendChild(wordSpan);

    // Get a few (up to 4) definitions only, without part of speech info
    let definitionsShown = 0;
    for (let meaning of data.meanings) {

        let definitionContainer = document.createElement("div");

        let definitionLiteralSpan = document.createElement("span");
        definitionLiteralSpan.innerText = "Definition: ";

        definitionContainer.appendChild(definitionLiteralSpan);
        
        for (let def of meaning.definitions) {
            
            if (definitionsShown >= 4) break;

            let definitionSpan = document.createElement("span");
            definitionSpan.innerText = def.definition;

            definitionContainer.appendChild(definitionSpan);

            if (def.example) {
                let exampleLiteralSpan = document.createElement("span");
                exampleLiteralSpan.innerText = "Example: ";

                let exampleSpan = document.createElement("span");
                exampleSpan.innerText = def.example;

                definitionContainer.appendChild(exampleLiteralSpan);
                definitionContainer.appendChild(exampleSpan);
            }

            popupBox.appendChild(definitionContainer);
            definitionsShown++;
        }
        if (definitionsShown >= 4) break;
    }

    // Stop events on popup from bubbling and closing it unintentionally
    events.forEach((event) => {
        popupBox.addEventListener(event, (e) => {
            e.stopPropagation();
            if (!['wheel', 'mousedown'].includes(event)) {
                e.preventDefault();
            }
        });
    });

    // add the sound icon <i class="fa-solid fa-volume-high"></i>
    let speakerButton = document.createElement('i');
    speakerButton.className="fa-solid fa-volume-high"
    speakerButton.style.cursor ="pointer"
    speakerButton.onclick = () => {
        let audio = new Audio(audioUrl) //needs custom url
        audio.play()
    }
    popupBox.appendChild(speakerButton)

    document.body.appendChild(popupBox);
    browser.runtime.sendMessage({ message: "meow" });
}

// Remove popup when clicking or pressing anything else
events.forEach((event) => {
    document.addEventListener(event, (e) => {
        let previousBox = document.getElementById("popupBox");
        if (previousBox) {
            document.body.removeChild(previousBox);
        }
    });
});

// Show popup if word was not found
function notFoundPopUp(word, x, y) {
    injectStyles()
    let notFoundParagraph = document.createElement("p");
    let notFoundText = `Couldn't find the word "${word}". Try googling? `;
    notFoundParagraph.id = "popupBox";
    notFoundParagraph.innerText = notFoundText;
    notFoundParagraph.classList.add("sabdartha-container");
    document.body.appendChild(notFoundParagraph);
    browser.runtime.sendMessage({ message: "meow" });
}

// Injects styles for the popup if not already injected
function injectStyles() {
    if (document.getElementById("sabdartha-styles")) return;

    const style = document.createElement("style");
    style.id = "sabdartha-styles";
    style.textContent = `
        .sabdartha-container {
            position: fixed;
            background-color: #1e1e1e;
            color: #f5f5f5;
            padding: 10px;
            max-width: 300px;
            max-height:300px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            font-family: 'Inter', sans-serif;
            z-index: 9999;
            overflow-y:scroll;
            scroll-behaviour:smooth;
        }

        .sabdartha-container span {
            display: block;
            margin-bottom: 4px;
        }

        .sabdartha-container span:first-child {
            font-weight: bold;
            font-size: 14px;
        }
    `;
    document.head.appendChild(style);
}


function checkAudioSource(data){ 
    let dataLength = data.length    

    for(i=0;i<dataLength;i++){
        if(data[i].audio){
           return data[i].audio
        }
        else {
            console.log("no audio source found")
            // TODO: add a text that says no audio beside the speaker button
        }
    }


}