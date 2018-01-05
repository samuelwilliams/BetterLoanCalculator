config = {
    resolution: 12,
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: "Standard Repayments",
            backgroundColor: '#0000ff',
            borderColor: '#0000ff',
            data: [],
            fill: false,
            pointRadius: 2.5
        }, {
            label: "Extra Repayments",
            backgroundColor: '#ff0000',
            borderColor: '#ff0000',
            data: [],
            fill: false,
            pointRadius: 2.5
        }]
    }
};

function View() {
    this.interestRate = document.getElementById("I");
    this.loanTerm = document.getElementById("N");
    this.principal = document.getElementById("P");
    this.interestSavings = document.getElementById('intrestSavings');
    this.totalInterest = document.getElementById('TI');
    this.loanEndDate = document.getElementById('loanEndDate');
    this.timeSavings = document.getElementById('timeSavings');
    this.extraRepayments = document.getElementById('extras');
    this.startDate = document.getElementById('start-date');
    this.repayments = document.getElementById("R");
    this.chart = document.getElementById("Chart");
    this.comparisonInterest = document.getElementById("newTI");

    this.lumpSumForm = document.getElementById('lumpSum');
    this.lumpSumDate = document.getElementById('lumpSum-date');
    this.lumpSumAmount = document.getElementById('lumpSum-amount');
    this.lumpSumsWrapper = document.getElementById('lumpSums-wrapper');
}

window.onload = function () {
    window.view = new View();
    window.myLine = new Chart(view.chart.getContext('2d'), config);
    window.startDate = new Date;
    window.view.startDate.value = window.startDate.toLocaleDateString();
    window.lumpSums = [];

    Calculate();
};

function Calculate() {
    let P = parseFloat(view.principal.value || 0);
    let I = 1 + parseFloat(view.interestRate.value || 0) / 1200;
    let N = 12 * parseFloat(view.loanTerm.value || 0);
    let R = Repayments(P, I, N);
    let extraRepayments = parseFloat(window.view.extraRepayments.value || 0);
    window.startDate = new Date(window.view.startDate.value);
    let endDate = new Date(window.view.startDate.value);

    window.loan = new Loan(P, I, R, []);
    window.comparison = new Loan(P, I, R + extraRepayments, window.lumpSums);

    N = Math.max(window.loan.PeriodsToZero(), window.comparison.PeriodsToZero());
    endDate.setMonth(startDate.getMonth() + window.comparison.PeriodsToZero());

    window.view.repayments.value = R.toCurrencyString();
    window.view.totalInterest.value = window.loan.TotalInterest.toCurrencyString();
    window.view.comparisonInterest.value = window.comparison.TotalInterest.toCurrencyString();
    window.view.interestSavings.value = (window.loan.TotalInterest - window.comparison.TotalInterest).toCurrencyString();
    window.view.loanEndDate.value = endDate.toLocaleDateString();
    window.view.timeSavings.value = timeSavingsString(parseInt(window.loan.PeriodsToZero() - window.comparison.PeriodsToZero()));

    config.resolution = (N <= 120) ? 6 : 12;
    config.data.labels = generateLabels(new Date(window.startDate.getTime()), N, config.resolution);
    config.data.datasets[0].data = generatePlotPoints(window.loan, N, config.resolution);
    config.data.datasets[1].data = generatePlotPoints(window.comparison, N, config.resolution);

    window.myLine.update();
}

function removeLumpSum(id) {
    window.lumpSums.forEach(function (lumpSum, index) {
        if (lumpSum.id === id) {
            window.lumpSums.splice(index, 1);
        }
    });

    let node = document.getElementById('lumpSum-' + id);
    node.remove();

    Calculate();
}

/**
 * Generate plot points for a given Loan
 *
 * @param Loan {Loan}
 * @param N {number} Number of periods to plot.
 * @param d_i {number} The resolution of the graph.
 * @returns {Array}
 */
function generatePlotPoints(Loan, N, d_i) {
    let vals = [];

    for (let i = 0; i <= N; i += d_i) {
        vals.push({
            x: i,
            y: Loan.AmountOwing(i)
        });
    }

    return vals;
}

/**
 * Generate the labels for the x axis of the chart.
 *
 * @param startDate {Date}
 * @param N {Number}
 * @param d_i {Number}
 * @returns {Array}
 */
function generateLabels(startDate, N, d_i) {
    let labels = [];
    for (let i = 0; i <= N; i += d_i) {
        labels.push(startDate.getFullYear());
        startDate.setMonth(startDate.getMonth() + d_i);
    }

    return labels;
}

document.getElementById('lumpSum').addEventListener('submit', function (event) {
    event.preventDefault();

    let date = new Date(window.view.lumpSumDate.value);
    let amount = parseFloat(window.view.lumpSumAmount.value);
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

    let period = dateDifferenceInMonths(window.startDate, date);
    window.lumpSums.push(new LumpSum(period, amount, id));

    window.view.lumpSumsWrapper.appendChild(liElement);
    window.view.lumpSumForm.reset();

    Calculate();
});

document.getElementById('form').addEventListener('submit', function (event) {
    event.preventDefault();
    Calculate();
});

//Initialise the JQuery-UI datepickers
$(function () {
    $("#lumpSum-date").datepicker();
    $("#start-date").datepicker();
});

/**
 * Calculate the difference in months between two dates.
 *
 * @param date_1 {Date}
 * @param date_2 {Date}
 *
 * @returns {number}
 */
function dateDifferenceInMonths(date_1, date_2) {
    return (date_2.getFullYear() - date_1.getFullYear()) * 12 + date_2.getMonth() - date_1.getMonth();
}

function timeSavingsString(months) {
    let returnString = '';

    if (Math.abs(months) > 18) {
        let years = Math.floor(months / 12);
        months = (months - years * 12);

        returnString += years;
        returnString += (years === 1) ? ' year ' : ' years ';
    }

    returnString += months;
    returnString += (months === 1) ? ' month' : ' months';

    return returnString;
}

/**
 * Formats a number as a currency string.
 *
 * @example (1234567.890123).toCurrencyString() = $1,234,567.89
 *
 * @returns {string}
 */
Number.prototype.toCurrencyString = function() {
    return '$' + this.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};