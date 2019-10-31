"use strict";

/**
 * Calculates the amount owing at period n.
 *
 * @param P {number} Principal of the loan
 * @param I {number} The interest rate greater than 1, e.g. 4.59%, I = 1.0459
 * @param R {number} The periodic repayment amount.
 * @param F {number} The periodic fee amount.
 * @param n {number} The period
 * @returns {number}
 */
function owing(P, I, R, F, n) {
    return P * I ** n - (R - F) * ( (1 - I ** n) / (1 - I) );
}

/**
 * Calculates the number of periods required before full repayment.
 *
 * @param P {number} Principal of the loan
 * @param I {number} The interest rate greater than 1, e.g. 4.59%, I = 1.0459
 * @param R {number} The periodic repayment amount.
 * @param F {number} The periodic fee amount.
 * @returns {number}
 */
function periodsToZero(P, I, R, F) {
    return -Math.log( (P / (R - F)) * (1 - I) + 1 ) / Math.log(I);
}

/**
 * Calculates the minimum repayments required for a given number of periods.
 *
 * @param P {number} Principal
 * @param I {number} The interest rate greater than 1, e.g. 4.59%, I = 1.0459
 * @param F {number} The periodic fee amount.
 * @param n {number} Number of periods the loan is compounded over.
 * @returns {number}
 */
function repayments(P, I, F, n) {
    return F + (P * I ** n) * (1 - I) / (1 - I ** n);
}

/**
 * Calculates the number of months between two dates.
 *
 * @param date_1 {Date}
 * @param date_2 {Date}
 * @returns {number}
 */
function dateDifferenceInMonths(date_1, date_2) {
    return (date_2.getFullYear() - date_1.getFullYear()) * 12 + date_2.getMonth() - date_1.getMonth();
}

/**
 * A once off loan repayment on a given date (loan period).
 *
 * @param date {Date} The date at which the lump sum takes effect.
 * @param amount {number} The value of the lump sum.
 * @constructor
 */
function LumpSum(date, amount) {
    this.id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 8);
    this.date = date;
    this.amount = amount;
    this.period = 0;
}

/**
 * Returns a clone of the LumpSum
 *
 * @returns {LumpSum}
 */
LumpSum.prototype.clone = function() {
    let clone = new LumpSum(this.date, this.amount);
    clone.id = this.id;
    clone.period = this.period;

    return clone;
};

/**
 * An array collection of <LumpSum> objects. Extends <Array> prototype.
 *
 * @constructor
 */
function LumpSumCollection() {}

LumpSumCollection.prototype = Object.create(Array.prototype);

/**
 * Return a clone of the LumpSum collection
 *
 * @returns {LumpSumCollection}
 */
LumpSumCollection.prototype.clone = function() {
    let output = new LumpSumCollection();
    this.forEach(function (lumpSum){
       output.push(lumpSum.clone());
    });

    return output;
};

/**
 * The loan object. This object represents a loan. The assumptions are:
 *   1) Each compounding period is one month, thus the loan is compounded monthly.
 *   2) The interest rate and repayment are fixed.
 *
 * @param principal {number} The loan principal amount.
 * @param interestRate {number} The interest rate of the loan per compounding period.
 * @param repayment {number} Loan repayment each compounding period.
 * @param extraRepayment {number} Extra loan repayment each compounding period.
 * @param fees {number} The periodic fee amount.
 * @param startDate {Date}
 * @param lumpSums {Array.<LumpSum>}
 * @constructor
 */
function Loan(principal, interestRate, repayment, extraRepayment, fees, startDate, lumpSums) {

    /**
     * @type {number}
     */
    this.principal = principal;

    /**
     * @type {number}
     */
    this.interestRate = interestRate;

    /**
     * @type {number}
     */
    this.repayment = repayment;

    /**
     * @type {number}
     */
    this.extraRepayment = extraRepayment;

    /**
     * @type {number}
     */
    this._repayment = repayment + extraRepayment;

    /**
     * @type {number}
     */
    this.fees = fees;

    /**
     * @type {Date}
     */
    this.startDate = startDate;

    /**
     * @type {string}
     */
    this.name = '';

    /**
     * The term of the loan.
     *
     * @type {number}
     */
    this.term = 0;

    /**
     * @type {Array<LumpSum>}
     */
    this.lumpSums = lumpSums;

    // Calculate the period at which the lumpSum takes effect.
    this.lumpSums.forEach(function (lumpSum) {
        lumpSum.period = dateDifferenceInMonths(startDate, lumpSum.date)
    });

    // Sort the lumps sums by period ascending.
    this.lumpSums.sort(function (a, b) {
        return (a.period === b.period) ? 0 : (a.period < b.period) ? -1 : 1;
    });
}

/**
 * Calculates the total of all payments over the term of the loan.
 *
 * @returns {number}
 */
Loan.prototype.totalRepayments = function() {
    let total = 0;
    let lastLumpSumPeriod = 0;

    this.lumpSums.forEach((lumpSum) => {
        total += (lumpSum.period - lastLumpSumPeriod) * this._repayment + lumpSum.amount;
        lastLumpSumPeriod = lumpSum.period;
    });

    return total +
        this._repayment * (this.periodsToZero() - lastLumpSumPeriod - 1) +
        this.amountOwing(this.periodsToZero() -1);
};

/**
 * Calculates the number of periods for the loan balance to reach $0.00.
 *
 * @returns {number}
 */
Loan.prototype.periodsToZero = function () {
    let lastLumpSumPeriod = 0;
    let balance = this.principal;

    this.lumpSums.forEach((lumpSum) => {
        balance = owing(balance, this.interestRate, this._repayment, this.fees, lumpSum.period - lastLumpSumPeriod) - lumpSum.amount;
        lastLumpSumPeriod = lumpSum.period;
    });

    let remainingPeriods = periodsToZero(balance, this.interestRate, this._repayment, this.fees);

    // Handle number rounding. If the decimal place GT 0.001, round up, otherwise round down.
    if (remainingPeriods - Math.floor(remainingPeriods) > 0.001) {
        remainingPeriods = Math.ceil((remainingPeriods));
    } else {
        remainingPeriods = Math.floor(remainingPeriods);
    }

    return lastLumpSumPeriod + remainingPeriods;
};

/**
 * Calculates the amount owing at some loan repayment period, n.
 *
 * @param n
 * @returns {number}
 */
Loan.prototype.amountOwing = function(n) {
    let lastLumpSumPeriod = 0;
    let balance = this.principal;

    this.lumpSums.forEach((lumpSum) => {
        if (lumpSum.period <= n) {
            balance = owing(balance, this.interestRate, this._repayment, this.fees, lumpSum.period - lastLumpSumPeriod) - lumpSum.amount;
            lastLumpSumPeriod = lumpSum.period;
        }
    });

    return Math.max(0, owing(balance, this.interestRate, this._repayment, this.fees, n - lastLumpSumPeriod));
};

/**
 * Amount owing on a particular date.
 *
 * @param {Date} date
 * @returns {number}
 */
Loan.prototype.amountOwingAtDate = function(date) {
    if (date.getTime() < this.startDate.getTime()) {
        return this.principal;
    }

    let period = dateDifferenceInMonths(this.startDate, date);

    return this.amountOwing(period);
};

/**
 * Calculates the total interest payable over the life of the loan.
 *
 * @returns {number}
 */
Loan.prototype.totalInterest = function() {
    return this.totalRepayments() - this.principal;
};

/**
 * Get the end date of the loan.
 * This assumes that each compounding period represents one month.
 *
 * @returns {Date}
 */
Loan.prototype.getEndDate = function getEndDate() {
    let endDate = new Date(this.startDate.getTime());
    endDate.setMonth(endDate.getMonth() + this.periodsToZero());

    return endDate;
};

/**
 * Calculates the minimum repayments required.
 *
 * @returns {number}
 */
Loan.prototype.minimumRepayments = function minimumRepayments() {
    return repayments(this.principal, this.interestRate, this.fees, this.term);
};

/**
 * A collection of <Loan> objects. Extends <Array> prototype.
 *
 * @constructor
 */
function LoanCollection() {}

LoanCollection.prototype = Object.create(Array.prototype);

/**
 * Returns the loan with the earliest start date.
 *
 * @returns {Loan}
 */
LoanCollection.prototype.getEarliestStartDate = function() {
    if (0 === this.length) {
        throw 'There are no Loans in the LoanCollection';
    }

    let earliestLoan = this[0];

    this.forEach(function(loan) {
        if (loan.startDate.getTime() < earliestLoan.startDate.getTime()) {
            earliestLoan = loan;
        }
    });

    return earliestLoan;
};

/**
 * Returns the loan with the latest end date.
 *
 * @returns {Loan}
 */
LoanCollection.prototype.getLatestEndDate = function() {
    if (0 === this.length) {
        throw 'There are no Loans in the LoanCollection';
    }

    let latestLoan = this[0];

    this.forEach(function(loan) {
        if (loan.getEndDate().getTime() > latestLoan.getEndDate().getTime()) {
            latestLoan = loan;
        }
    });

    return latestLoan;
};

