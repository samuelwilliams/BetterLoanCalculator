ChartColors = {
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
 * Pick a color from the ChartColors sequentially.
 *
 * @returns {*}
 */
function pickColor() {
    if (typeof window.colorIndex === 'undefined' || window.colorIndex >= Object.keys(window.ChartColors).length) {
        window.colorIndex = -1;
    }

    window.colorIndex++;
    let col = (window.ChartColors[Object.keys(window.ChartColors)[window.colorIndex]]).hex;

    return tinycolor(col);
}

const blankDataSet = {
    label: '',
    backgroundColor: ChartColors.Grey.hex,
    borderColor: ChartColors.Grey.hex,
    data: [],
    fill: false,
    pointRadius: 2.5,
    options: {
        scales: {
            xAxes: [{
                type: 'time',
                time: {
                    displayFormats: {
                        quarter: 'MMM YYYY'
                    }
                }
            }]
        }
    }
};

//The chart configuration
config = {
    resolution: 12, //Number of compounding periods between plot points.
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Loan',
            backgroundColor: ChartColors.Navy.hex,
            borderColor: ChartColors.Navy.hex,
            data: [],
            fill: false,
            pointRadius: 2.5
        }]
    },
    options: {
        responsive: true,
        title:{
            display: false
        },
        scales: {
            xAxes: [{
                type: "time",
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Date'
                },
                ticks: {
                    major: {
                        fontStyle: "bold",
                        fontColor: "#FF0000"
                    }
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'value'
                },
                ticks: {
                    callback: function (value, index, values) {
                        return value.toCurrencyString();
                    }
                }
            }]
        },
        tooltips: { 
            callbacks: {
                label: function(tooltipItem, data) {
                    return tooltipItem.yLabel.toCurrencyString();
                },
                title: function(tooltipItem, data) {
                    return tooltipItem[0].xLabel.toLocaleFormat();
                }
            }
        }
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
    this.loanEstFee = document.getElementById('LEF');
    this.fees = document.getElementById('F');
    this.totalInterest = document.getElementById('totalInterest');
    this.loanEndDate = document.getElementById('loanEndDate');
    this.extraRepayments = document.getElementById('extras');
    this.startDate = document.getElementById('start-date');
    this.repayments = document.getElementById('R');
    this.repayments_fn = document.getElementById('R-fn');
    this.chart = document.getElementById('Chart');
    this.name = document.getElementById('Name');

    this.lumpSumDate = document.getElementById('lumpSum-date');
    this.lumpSumAmount = document.getElementById('lumpSum-amount');
    this.lumpSumsWrapper = document.getElementById('lumpSums-wrapper');

    this.loanTable = document.getElementById('loanTableBody');
    this.extrasFreqFn = document.getElementById('extrasFreq-fn');
}

/**
 * Takes the form input and generates a Loan object.
 *
 * @returns {Loan}
 */
function loanFromInput() {
    let principal = parseFloat(view.principal.value || '0') + parseFloat(view.loanEstFee.value || '0');
    let interest = 1 + parseFloat(view.interestRate.value || '0') / 1200;
    let term = 12 * parseFloat(view.loanTerm.value || '0');
    let fees = parseFloat(view.fees.value || '0');
    let minRepayments = repayments(principal, interest, fees, term);
    let extraRepayments = parseFloat(window.view.extraRepayments.value || '0');
    if (view.extrasFreqFn.checked == true) {
        extraRepayments = extraRepayments * (26/12);
    }
    let startDate = new Date(window.view.startDate.value);

    let loan = new Loan(principal, interest, minRepayments, extraRepayments, fees, startDate, window.lumpSums.clone());
    loan.name = view.name.value;
    loan.term = term;

    return loan;
}

function newComparison() {
    let loan = loanFromInput();
    let dataSet = Object.assign({}, blankDataSet);
    loan.color = window.color;

    window.loans.push(loan);

    dataSet.label = loan.name;
    dataSet.backgroundColor = loan.color.toHexString();
    dataSet.borderColor = loan.color.toHexString();
    dataSet.data = generatePlotPoints(loan, config.resolution);

    config.data.datasets.push(dataSet);
    window.myLine.update();
    buildTable();

    calculate();
    window.color = window.pickColor();
}

/**
 * Runs the calculations and updates the chart.
 */
function calculate() {
    let loan = loanFromInput();
    let term = Math.ceil(loan.periodsToZero() / 6) * 6;

    window.loans.splice(0, 1, loan);

    window.view.repayments.value = loan.minimumRepayments().toCurrencyString();
    window.view.repayments_fn.value = (loan.minimumRepayments() * 12/26).toCurrencyString();
    window.view.totalInterest.value = loan.totalInterest().toCurrencyString();
    window.view.loanEndDate.value = loan.getEndDate().toLocaleFormat();
    window.view.totalInterest.value = loan.totalInterest().toCurrencyString();

    config.resolution = (term <= 120) ? 3 : 12;

    config.data.datasets[0].data = generatePlotPoints(loan, config.resolution);
    config.data.datasets[0].label = loan.name;
    config.data.datasets[0].backgroundColor = window.color.toHexString();
    config.data.datasets[0].borderColor = window.color.toHexString();

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
    dateElement.appendChild(document.createTextNode(lumpSum.date.toLocaleFormat()));

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

function buildTable() {
    let output = '';
    window.loans.forEach(function(loan, index) {
        //Skip the first iteration.
        if (index === 0) return;

        output +=
            '<tr id="loan-' + index.toString() + '">'+
                '<td><input class="color-picker" id="loan-' + index.toString() + '-color" value="' + loan.color.toHexString() + '" /></td>' +
                '<td><span contentEditable="true" id="loan-' + index.toString() + '-name" oninput="updateLoanName('+ index.toString() +')">' + loan.name + '</span></td>' +
                '<td>' + loan.principal.toCurrencyString() + '</td>' +
                '<td>' + ((loan.interestRate - 1) * 1200).toFixed(2) + '\%</td>' +
                '<td>' + loan.fees.toCurrencyString() + '</td>' +
                '<td>' + timeSavingsString(loan.term) + '</td>' +
                '<td>' + loan.startDate.toLocaleFormat()+ '</td>' +
                '<td>' + loan.getEndDate().toLocaleFormat() + '</td>' +
                '<td>' + loan.repayment.toCurrencyString() + '</td>' +
                '<td>' + loan.extraRepayment.toCurrencyString() + '</td>' +
                '<td>' + lumpSumList(loan.lumpSums) + '</td>' +
                '<td>' + loan.totalInterest().toCurrencyString() + '</td>' +
                '<td>' + timeSavingsString(dateDifferenceInMonths(loan.startDate, loan.getEndDate())) + '</td>' +
                '<td><a href="#" onclick="deleteLoan(event, ' + index.toString() + ')">Delete</a></td>' +
            '</tr>';
    });

    window.view.loanTable.innerHTML = output;
    initialiseColorPickers();
}

function initialiseColorPickers() {
    window.loans.forEach(function(loan, index) {
        let id = '#loan-' + index.toString() + '-color';
        $(id).spectrum({
            change: function(color) {
                window.updateLoanColor(index, color);
            }
        });
    });
}

function lumpSumList(lumpSums) {
    let output = '<ul class="table-lump-sums">';
    lumpSums.forEach(function(lumpSum) {
        output += '<li>' + lumpSum.date.toLocaleFormat() + ': ' + lumpSum.amount.toCurrencyString() + '</li>';
    });

    return output + '</ul>';
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
 * @param loan {Loan}
 * @param d_i {number} The resolution of the graph.
 * @returns {Array}
 */
function generatePlotPoints(loan, d_i) {
    let values = [];
    let date = new Date(loan.startDate.getTime());
    let flag = false;

    while (!flag) {
        values.push({
            x: new Date(date.getTime()),
            y: loan.amountOwingAtDate(date).toFixed(2)
        });

        flag = loan.amountOwingAtDate(date) < loan.repayment;
        date.setMonth(date.getMonth() + d_i);
    }

    return values;
}

/**
 * Formats a duration of months into a string.
 *
 * @example
 * // returns '1 year 7 months'
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
        returnString += (years === 1) ? ' year' : ' years';
    }

    if (months > 0) {
        returnString += ' ' + months;
        returnString += (months === 1) ? ' month' : ' months';
    }

    return returnString;
}

window.onload = function () {
    window.view = new View();
    window.myLine = new Chart(view.chart.getContext('2d'), config);
    window.startDate = new Date;
    window.view.startDate.value = window.startDate.toLocaleFormat();
    window.lumpSums = new LumpSumCollection();
    window.loans = new LoanCollection();
    window.color = window.pickColor();

    calculate();
};

function updateLoanName(index) {
    let id = 'loan-' + index + '-name';
    let name = document.getElementById(id).innerText;
    window.loans[parseInt(index)].name = name;
    config.data.datasets[parseInt(index)].label = name;
    window.myLine.update();
}

function updateLoanColor(index, color) {
    window.loans[parseInt(index)].color = color;
    config.data.datasets[parseInt(index)].backgroundColor = color.toHexString();
    config.data.datasets[parseInt(index)].borderColor = color.toHexString();
    window.myLine.update();
}

function deleteLoan(event, index) {
    event.preventDefault();
    window.loans.splice(index, 1);
    config.data.datasets.splice(index, 1);
    window.myLine.update();
    buildTable();
}

//Listener for the lump sum form. This creates the lump sum list elements from the form input.
document.getElementById('lumpSum').addEventListener('submit', function (event) {
    event.preventDefault();

    let lumpSum = new LumpSum(
        new Date(window.view.lumpSumDate.value),
        parseFloat(window.view.lumpSumAmount.value) || 0
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
    $('#lumpSum-date').datepicker({ dateFormat: 'd M yy' });
    $('#start-date').datepicker({ dateFormat: 'd M yy' });
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

Date.prototype.toLocaleFormat = function() {
    var monthNames = [
        "Jan", "Feb", "Mar",
        "Apr", "May", "Jun",
        "Jul", "Aug", "Sep",
        "Oct", "Nov", "Dec"
      ];
    
      var day = this.getDate();
      var monthIndex = this.getMonth();
      var year = this.getFullYear();
    
      return day + ' ' + monthNames[monthIndex] + ' ' + year;
};
