//The chart configuration
config = {
    resolution: 12, //Number of compounding periods between plot points.
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Standard Repayments',
            backgroundColor: '#0000ff',
            borderColor: '#0000ff',
            data: [],
            fill: false,
            pointRadius: 2.5
        }, {
            label: 'Extra Repayments',
            backgroundColor: '#ff0000',
            borderColor: '#ff0000',
            data: [],
            fill: false,
            pointRadius: 2.5
        }]
    }
};

/**
 * This is an abstraction for the different elements on the page.
 *
 * @constructor
 */
function View() {
    this.form = document.getElementById('form');
    this.interestRate = document.getElementById('I');
    this.loanTerm = document.getElementById('N');
    this.principal = document.getElementById('P');
    this.interestSavings = document.getElementById('interestSavings');
    this.totalInterest = document.getElementById('TI');
    this.loanEndDate = document.getElementById('loanEndDate');
    this.timeSavings = document.getElementById('timeSavings');
    this.extraRepayments = document.getElementById('extras');
    this.startDate = document.getElementById('start-date');
    this.repayments = document.getElementById('R');
    this.chart = document.getElementById('Chart');
    this.comparisonInterest = document.getElementById('newTI');

    this.lumpSumDate = document.getElementById('lumpSum-date');
    this.lumpSumAmount = document.getElementById('lumpSum-amount');
    this.lumpSumsWrapper = document.getElementById('lumpSums-wrapper');
}

/**
 * Runs the calculations and updates the chart.
 */
function calculate() {
    let P = parseFloat(view.principal.value || '0');
    let I = 1 + parseFloat(view.interestRate.value || '0') / 1200;
    let N = 12 * parseFloat(view.loanTerm.value || '0');
    let R = repayments(P, I, N);
    let extraRepayments = parseFloat(window.view.extraRepayments.value || '0');
    window.startDate = new Date(window.view.startDate.value);
    let endDate = new Date(window.view.startDate.value);

    window.loan = new Loan(P, I, R, window.startDate, []);
    window.comparison = new Loan(P, I, R + extraRepayments, window.startDate, window.lumpSums);

    N = Math.max(window.loan.periodsToZero(), window.comparison.periodsToZero());
    endDate.setMonth(startDate.getMonth() + window.comparison.periodsToZero());

    window.view.repayments.value = R.toCurrencyString();
    window.view.totalInterest.value = window.loan.totalInterest.toCurrencyString();
    window.view.comparisonInterest.value = window.comparison.totalInterest.toCurrencyString();
    window.view.interestSavings.value = (window.loan.totalInterest - window.comparison.totalInterest).toCurrencyString();
    window.view.loanEndDate.value = endDate.toLocaleDateString();
    window.view.timeSavings.value = timeSavingsString(window.loan.periodsToZero() - window.comparison.periodsToZero());

    config.resolution = (N <= 120) ? 6 : 12;
    config.data.labels = generateLabels(new Date(window.startDate.getTime()), N, config.resolution);
    config.data.datasets[0].data = generatePlotPoints(window.loan, N, config.resolution);
    config.data.datasets[1].data = generatePlotPoints(window.comparison, N, config.resolution);

    window.myLine.update();
}

/**
 * Adds a LumpSum as a list element to the lumpSums-wrapper UL.
 *
 * @param lumpSum {LumpSum}
 */
function createLumpSumNode(lumpSum) {
    let dateElement = document.createElement('span');
    dateElement.className = 'date';
    dateElement.appendChild(document.createTextNode(lumpSum.date.toLocaleDateString()));

    let amountElement = document.createElement('span');
    amountElement.className = 'amount';
    amountElement.appendChild(document.createTextNode(lumpSum.amount.toCurrencyString()));

    let deleteElement = document.createElement('a');
    deleteElement.innerText = 'delete';
    deleteElement.className = 'delete';
    deleteElement.href = '#';
    deleteElement.addEventListener('click', function (event) {
        event.preventDefault();
        removeLumpSum(lumpSum);
        calculate();
    });

    let liElement = document.createElement('li');
    liElement.id = 'lumpSum-' + lumpSum.id;
    liElement.appendChild(dateElement);
    liElement.appendChild(amountElement);
    liElement.appendChild(deleteElement);

    window.view.lumpSumsWrapper.appendChild(liElement);
}

/**
 * Remove a lump sum from the lumpSums array and from the document.
 *
 * @param lumpSum {LumpSum} LumpSum to be removed.
 */
function removeLumpSum(lumpSum) {
    window.lumpSums.forEach(function (lumpSumIterate, index) {
        if (lumpSumIterate.id === lumpSum.id) {
            window.lumpSums.splice(index, 1);
        }
    });

    let node = document.getElementById('lumpSum-' + lumpSum.id);
    node.remove();
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
    let values = [];

    for (let i = 0; i <= N; i += d_i) {
        values.push({
            x: i,
            y: Loan.amountOwing(i)
        });
    }

    return values;
}

/**
 * Generate the labels for the x-axis of the chart.
 *
 * @param startDate {Date} The loan start date.
 * @param N {Number} The total number of periods.
 * @param d_i {Number} The resolution / number of periods between each calculation.
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

/**
 * Formats a duration of months into a string.
 *
 * @example
 * // returns '1 year 1 month'
 * timeSavingsString(19);
 *
 * @param months {number}
 * @returns {string}
 */
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

window.onload = function () {
    window.view = new View();
    window.myLine = new Chart(view.chart.getContext('2d'), config);
    window.startDate = new Date;
    window.view.startDate.value = window.startDate.toLocaleDateString();
    window.lumpSums = [];

    calculate();
};

//Listener for the lump sum form. This creates the lump sum list elements from the form input.
document.getElementById('lumpSum').addEventListener('submit', function (event) {
    event.preventDefault();

    let lumpSum = new LumpSum(
        new Date(window.view.lumpSumDate.value),
        parseFloat(window.view.lumpSumAmount.value)
    );

    window.lumpSums.push(lumpSum);
    createLumpSumNode(lumpSum);

    this.reset();
    calculate();
});

//Listener for the main form to initiate calculations.
document.getElementById('form').addEventListener('submit', function (event) {
    event.preventDefault();
    calculate();
});

//Initialise the JQuery-UI date pickers.
$(function () {
    $('#lumpSum-date').datepicker();
    $('#start-date').datepicker();
});

/**
 * Formats a number as a currency string.
 *
 * @example
 * // returns '$1,234,567.89'
 * (1234567.890123).toCurrencyString();
 * @returns {string}
 */
Number.prototype.toCurrencyString = function() {
    return '$' + this.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};