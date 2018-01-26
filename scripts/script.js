ChartColours = {
    "Red": {"hex": "#e6194b", "rgb": "rgb(230, 25, 75)"},
    "Green": {"hex": "#3cb44b", "rgb": "rgb(60, 180, 75)"},
    "Yellow": {"hex": "#ffe119", "rgb": "rgb(255, 225, 25)"},
    "Blue": {"hex": "#0082c8", "rgb": "rgb(0, 130, 200)"},
    "Orange": {"hex": "#f58231", "rgb": "rgb(245, 130, 48)"},
    "Purple": {"hex": "#911eb4", "rgb": "rgb(145, 30, 180)"},
    "Cyan": {"hex": "#46f0f0", "rgb": "rgb(70, 240, 240)"},
    "Magenta": {"hex": "#f032e6", "rgb": "rgb(240, 50, 230)"},
    "Lime": {"hex": "#d2f53c", "rgb": "rgb(210, 245, 60)"},
    "Pink": {"hex": "#fabebe", "rgb": "rgb(250, 190, 190)"},
    "Teal": {"hex": "#008080", "rgb": "rgb(0, 128, 128)"},
    "Lavender": {"hex": "#e6beff", "rgb": "rgb(230, 190, 255)"},
    "Brown": {"hex": "#aa6e28", "rgb": "rgb(170, 110, 40)"},
    "Maroon": {"hex": "#800000", "rgb": "rgb(128, 0, 0)"},
    "Mint": {"hex": "#aaffc3", "rgb": "rgb(170, 255, 195)"},
    "Olive": {"hex": "#808000", "rgb": "rgb(128, 128, 0)"},
    "Coral": {"hex": "#ffd8b1", "rgb": "rgb(255, 215, 180)"},
    "Navy": {"hex": "#000080", "rgb": "rgb(0, 0, 128)"},
    "Grey": {"hex": "#808080", "rgb": "rgb(128, 128, 128)"},
    "Black": {"hex": "#000000", "rgb": "rgb(0, 0, 0)"},
};

/**
 * Picks out a random colour.
 *
 * @returns {*}
 */
function randomColor() {
    let colours = [];
    for (let colour in ChartColours) {
        colours.push(colour);
    }
    let colour = colours[Math.floor(Math.random() * colours.length)];

    return ChartColours[colour];
}

const blankDataset = {
    label: '',
    backgroundColor: ChartColours.Blue.hex,
    borderColor: ChartColours.Blue.hex,
    data: [],
    fill: false,
    pointRadius: 2.5
};

//The chart configuration
config = {
    resolution: 12, //Number of compounding periods between plot points.
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Standard Repayments',
            backgroundColor: ChartColours.Blue.hex,
            borderColor: ChartColours.Blue.hex,
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
    this.name = document.getElementById('Name');

    this.lumpSumDate = document.getElementById('lumpSum-date');
    this.lumpSumAmount = document.getElementById('lumpSum-amount');
    this.lumpSumsWrapper = document.getElementById('lumpSums-wrapper');
}

/**
 * Takes the form input and generates a Loan object.
 *
 * @returns {Loan}
 */
function loanFromInput() {
    let principal = parseFloat(view.principal.value || '0');
    let interest = 1 + parseFloat(view.interestRate.value || '0') / 1200;
    let term = 12 * parseFloat(view.loanTerm.value || '0');
    let minRepayments = repayments(principal, interest, term);
    let extraRepayments = parseFloat(window.view.extraRepayments.value || '0');
    let startDate = new Date(window.view.startDate.value);

    let loan = new Loan(principal, interest, minRepayments + extraRepayments, startDate, window.lumpSums);
    loan.name = view.name.value;
    loan.term = term;

    return loan;
}

function newComparison() {
    let loan = loanFromInput();
    let dataset = Object.assign({}, blankDataset);
    let color = randomColor();

    dataset.label = loan.name;
    dataset.backgroundColor = color.hex;
    dataset.borderColor = color.hex;
    dataset.data = generatePlotPoints(loan, config.resolution);

    config.data.datasets.push(dataset);
    window.myLine.update();
}

/**
 * Runs the calculations and updates the chart.
 */
function calculate() {
    let loan = loanFromInput();
    let term = Math.ceil(loan.periodsToZero() / 6) * 6;

    window.view.repayments.value = loan.minimumRepayments().toCurrencyString();
    window.view.totalInterest.value = loan.totalInterest().toCurrencyString();
    window.view.loanEndDate.value = loan.getEndDate().toLocaleDateString();

    config.resolution = (term <= 120) ? 6 : 12;
    config.data.labels = generateLabels(new Date(loan.startDate.getTime()), term, config.resolution);

    config.data.datasets[0].data = generatePlotPoints(loan, config.resolution);

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
 * @param d_i {number} The resolution of the graph.
 * @returns {Array}
 */
function generatePlotPoints(Loan, d_i) {
    let values = [];

    for (let i = 0; i <= Loan.periodsToZero(); i += d_i) {
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
    window.loans = [];
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

document.getElementById('addComparison').addEventListener('click', function (event) {
    event.preventDefault();
    newComparison();
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