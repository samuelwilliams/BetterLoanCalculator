
let config = {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: "Standard Repayments",
            backgroundColor: '#0000ff',
            borderColor: '#0000ff',
            data: [],
            fill: false,
            pointRadius: 1.5
        }, {
            label: "Extra Repayments",
            backgroundColor: '#ff0000',
            borderColor: '#ff0000',
            data: [],
            fill: false,
            pointRadius: 1.5
        }]
    }
};

function Calculations() {
    this.startDate = new Date();
    this.lumpSums = [];
    this.intrestSavings = document.getElementById('intrestSavings');
    this.totalInterest = document.getElementById('TI');
    this.loanEndDate = document.getElementById('loanEndDate');
    this.timeSavings = document.getElementById('timeSavings');
}

function calculate() {
    let n = 12 * parseFloat(document.getElementById("N").value || 0);
    let P = parseFloat(document.getElementById("P").value || 0);
    let I = 1 + parseFloat(document.getElementById("I").value || 0) / 1200;
    let R = Repayments(P, I, n);
    let extras = parseFloat(document.getElementById("extras").value || 0);
    let d_i = 6;
    let startDate = new Date(document.getElementById('start-date').value);

    let newTotalInterest = TotalRepayments(P, I, R + extras, window.calculations.lumpSums) - P;
    let periodsToZero = _periodsToZero(P, I, R + extras, window.calculations.lumpSums);
    let newEndDate = new Date(window.calculations.startDate.valueOf());
    newEndDate.setMonth(newEndDate.getMonth() + periodsToZero);

    let totalPeriods = Math.max(n, periodsToZero);
    let labels = generateLabels(startDate, totalPeriods, d_i);
    let vals = plotPayments(P, I, R, totalPeriods, d_i, []);
    let additionalPayments = plotPayments(P, I, R + extras, totalPeriods, d_i, window.calculations.lumpSums);

    document.getElementById("R").value = R.toCurrencyString();
    window.calculations.totalInterest.value = (R*n - P).toCurrencyString();
    document.getElementById("newTI").value = newTotalInterest.toCurrencyString();
    window.calculations.intrestSavings.value = ( (R*n - P) - newTotalInterest).toCurrencyString();
    window.calculations.loanEndDate.value = newEndDate.toLocaleDateString();

    window.calculations.timeSavings.value = timeSavingsString(parseInt(PeriodsToZero(P, I, R) - periodsToZero));

    config.data.labels = labels;
    config.data.datasets[0].data = vals;
    config.data.datasets[1].data = additionalPayments;

    window.myLine.update();
}

document.getElementById('lumpSum').addEventListener('submit', function (event) {
    event.preventDefault();
    let date = new Date(document.getElementById('lumpSum-date').value);
    let amount = parseFloat(document.getElementById('lumpSum-amount').value);
    addLumpSum(date, amount);
    calculate();
    this.reset();
});

function addLumpSum(date, amount) {
    let id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 8);
    let dateElement = document.createElement('span');
    dateElement.className = 'date';
    dateElement.appendChild(document.createTextNode(date.toLocaleDateString()));

    let amountElement = document.createElement('span');
    amountElement.className = 'amount';
    amountElement.appendChild(document.createTextNode(amount.toCurrencyString()));

    let deleteElement = document.createElement('a');
    deleteElement.innerText = 'delete';
    deleteElement.className = 'delete';
    deleteElement.href = '#';
    deleteElement.addEventListener('click', function (event) {
        event.preventDefault();
        removeLumpSum(id);
    });

    let liElement = document.createElement('li');
    liElement.id = 'lumpSum-' + id;
    liElement.appendChild(dateElement);
    liElement.appendChild(amountElement);
    liElement.appendChild(deleteElement);

    let period = dateDifferenceInMonths(window.calculations.startDate, date);
    window.calculations.lumpSums.push(new LumpSum(period, amount, id));

    document.getElementById('lumpSums-wrapper').appendChild(liElement);
}

function removeLumpSum(id) {
    window.calculations.lumpSums.forEach(function (lumpSum, index) {
        if (lumpSum.id === id) {
            window.calculations.lumpSums.splice(index, 1);
        }
    });

    let node = document.getElementById('lumpSum-' + id);
    node.remove();

    calculate();
}

window.onload = function() {
    let ctx = document.getElementById("Chart").getContext('2d');
    window.myLine = new Chart(ctx, config);
    window.calculations = new Calculations();

    document.getElementById('start-date').value = window.calculations.startDate.toLocaleDateString();
    calculate();
};

document.getElementById('form').addEventListener('submit', function (event) {
    event.preventDefault();
    calculate();
});

$( function() {
    $( "#lumpSum-date" ).datepicker();
    $( "#start-date" ).datepicker();
} );

/**
 *
 * @param date_1 {Date}
 * @param date_2 {Date}
 */
function dateDifferenceInMonths(date_1, date_2) {
    return (date_2.getFullYear() - date_1.getFullYear()) * 12 + date_2.getMonth() - date_1.getMonth();
}

function timeSavingsString(months) {
    let returnString = '';

    if (months > 18) {
        let years = Math.floor(months / 12);
        months = (months - years * 12);

        returnString += years;
        returnString += (years === 1) ? ' year ' : ' years ';
    }

    returnString += months;
    returnString += (months === 1) ? ' month' : ' months';

    return returnString;
}