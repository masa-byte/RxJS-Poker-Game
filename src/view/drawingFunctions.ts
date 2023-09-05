
export function drawPlayerInput(container: HTMLElement) {
    const divNick = document.createElement("div");
    divNick.classList.add("playerInput");

    const labelNick = document.createElement("label");
    labelNick.htmlFor = "playerNickInput";
    labelNick.innerText = "Enter your nickname:";

    const inputNick = document.createElement("input");
    inputNick.type = "text";
    inputNick.id = "playerNickInput";
    inputNick.textContent = ""

    const divChips = document.createElement("div");
    divChips.classList.add("chipsInput");

    const labelChips = document.createElement("label");
    labelChips.htmlFor = "playerChipsInput";
    labelChips.innerText = "Enter starting chips amount:";

    const inputChips = document.createElement("input");
    inputChips.type = "number";
    inputChips.id = "playerChipsInput";
    inputChips.textContent = ""

    divNick.appendChild(labelNick);
    divNick.appendChild(inputNick);
    divChips.appendChild(labelChips);
    divChips.appendChild(inputChips);
    container.appendChild(divNick);
    container.appendChild(divChips);
}

export function drawTimer(container: HTMLElement) {

    const divMain = document.createElement("div");
    divMain.classList.add("timerNotification");

    const divNotification = document.createElement("div");
    divNotification.classList.add("notification");

    const labelNotification = document.createElement("label");
    labelNotification.htmlFor = "notification";
    labelNotification.innerText = "Notification: ";

    const spanNotification = document.createElement("span");
    spanNotification.id = "notification";
    spanNotification.innerText = "Enter nickname and chips amount";

    const divTimer = document.createElement("div");
    divTimer.classList.add("timer");

    const labelTimer = document.createElement("label");
    labelTimer.htmlFor = "timer";
    labelTimer.innerText = "Time left: ";

    const spanTimer = document.createElement("span");
    spanTimer.id = "timer";
    spanTimer.innerText = "n/a";

    divNotification.appendChild(labelNotification);
    divNotification.appendChild(spanNotification);
    divMain.appendChild(divNotification);

    divTimer.appendChild(labelTimer);
    divTimer.appendChild(spanTimer);
    divMain.appendChild(divTimer);

    container.appendChild(divMain);
}

export function drawDeck(container: HTMLElement) {
    const divMain = document.createElement("div");
    divMain.classList.add("deck");

    const divCommunityCards = document.createElement("div");
    divCommunityCards.classList.add("communityCards");
    divCommunityCards.innerText = "Community cards: ";

    drawCommunityCards(divCommunityCards);

    divMain.appendChild(divCommunityCards);
    container.appendChild(divMain);
}

function drawCommunityCards(container: HTMLElement) {
    for (let i = 0; i < 5; i++) {
        const card = document.createElement("div");
        card.classList.add("communityCard");
        card.classList.add("communityCard" + i);
        card.innerText = "n/a";
        container.appendChild(card);
    }
}

export function drawPlayersInfo(container: HTMLElement) {
    const divMain = document.createElement("div");
    divMain.classList.add("players");

    drawPlayers(divMain);

    container.appendChild(divMain);
}

function drawPlayers(container: HTMLElement) {
    for (let i = 0; i < 3; i++) {
        const divPlayer = document.createElement("div");
        divPlayer.classList.add("player");
        divPlayer.classList.add("player" + i);

        const divName = document.createElement("div");
        divName.classList.add("playerName");
        divName.innerText = "Bot" + i;

        if(i == 0) { 
            divName.innerText = "You";
            divName.id = "playerName";
        }

        const divCards = document.createElement("div");
        divCards.classList.add("playerCards" + i);
        divCards.innerText = "Cards: ";

        drawPlayerCards(divCards);

        const divChips = document.createElement("div");
        divChips.classList.add("playerChips");
        divChips.innerText = "Chips: ";

        const spanChips = document.createElement("span");
        spanChips.id = "chips" + i;
        spanChips.innerText = "n/a";

        divChips.appendChild(spanChips);

        divPlayer.appendChild(divName);
        divPlayer.appendChild(divCards);
        divPlayer.appendChild(divChips);

        container.appendChild(divPlayer);
    }
}

function drawPlayerCards(container: HTMLElement) {
    for (let i = 0; i < 2; i++) {
        const card = document.createElement("div");
        card.classList.add("playerCard");
        card.classList.add("playerCard" + i);
        card.innerText = "n/a";
        container.appendChild(card);
    }
}