const currentDateElementCalendario = document.querySelector(".current-date");
const daysTag = document.querySelector(".days");
const prevNextIcon = document.querySelectorAll(".icons img");

let dateCal = new Date(); // Renomeado para evitar conflito se 'date' for usado em main.js
let currYearCal = dateCal.getFullYear();
let currMonthCal = dateCal.getMonth();

const monthsCal = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const renderCalendar = () => {
    if (!currentDateElementCalendario || !daysTag) return;
    let firstDayofMonth = new Date(currYearCal, currMonthCal, 1).getDay();
    let lastDateofMonth = new Date(currYearCal, currMonthCal + 1, 0).getDate();
    let lastDayofMonth = new Date(currYearCal, currMonthCal, lastDateofMonth).getDay();
    let lastDateofLastMonth = new Date(currYearCal, currMonthCal, 0).getDate();
    let liTag = "";

    for (let i = firstDayofMonth; i > 0; i--) {
        liTag += `<li class="inactive">${lastDateofLastMonth - i + 1}</li>`;
    }

    for (let i = 1; i <= lastDateofMonth; i++) {
        let isToday = i === new Date().getDate() && currMonthCal === new Date().getMonth() &&
            currYearCal === new Date().getFullYear() ? "active" : "";
        liTag += `<li class="${isToday}" data-day="${i}">${i}</li>`;
    }

    for (let i = lastDayofMonth; i < 6; i++) {
        liTag += `<li class="inactive">${i - lastDayofMonth + 1}</li>`;
    }

    currentDateElementCalendario.innerText = `${monthsCal[currMonthCal]} ${currYearCal}`;
    daysTag.innerHTML = liTag;
    addDayClickListeners(); // Função definida em main.js ou aqui mesmo se preferir
};

prevNextIcon.forEach(icon => {
    icon.addEventListener("click", () => {
        if (!icon.id) {
            console.warn("Ícone de navegação do calendário não possui ID ('prev' ou 'next').");
            return;
        }
        currMonthCal = icon.id === "prev" ? currMonthCal - 1 : currMonthCal + 1;
        if (currMonthCal < 0 || currMonthCal > 11) {
            dateCal = new Date(currYearCal, currMonthCal);
            currYearCal = dateCal.getFullYear();
            currMonthCal = dateCal.getMonth();
        }
        renderCalendar();
    });
});