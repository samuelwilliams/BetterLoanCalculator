"use strict";

/**
 * Calculates the amount owing at period n.
 *
 * @param P {number} Principal of the loan
 * @param I {number} The interest rate greater than 1, e.g. 4.59%, I = 1.0459
 * @param R {number} The periodic repayment amount.
 * @param n {number} The period
 * @returns {number}
 */
function owing(P, I, R, n) {
    return P * I ** n - R * ( (1 - I ** n) / (1 - I) );
}

/**
 * Calculates the number of periods required before full repayment.
 *
 * @param P {number} Principal of the loan
 * @param I {number} The interest rate greater than 1, e.g. 4.59%, I = 1.0459
 * @param R {number} The periodic repayment amount.
 * @returns {number}
 */
function periodsToZero(P, I, R) {
    return -Math.log( (P / R) * (1 - I) + 1 ) / Math.log(I);
}

/**
 * Calculates the minimum repayments required for a given number of periods.
 *
 * @param P {number} Principal
 * @param I {number} The interest rate greater than 1, e.g. 4.59%, I = 1.0459
 * @param n {number} Number of periods the loan is compounded over.
 * @returns {number}
 */
function repayments(P, I, n) {
    return (P * I ** n) * (1 - I) / (1 - I ** n);
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
 * The application
 *
 * @param principal {number} The loan principal amount.
 * @param interestRate {number} The interest rate of the loan per compounding period.
 * @param repayment {number} Loan repayment each compounding period.
 * @param startDate {Date}
 * @param lumpSums {Array.<LumpSum>}
 * @constructor
 */
function Loan(principal, interestRate, repayment, startDate, lumpSums) {

    // Calculate the period at which the lumpSum takes effect.
    lumpSums.forEach(function(lumpSum) {
        lumpSum.period = dateDifferenceInMonths(startDate, lumpSum.date)
    });

    // Sort the lumps sums by period ascending.
    lumpSums.sort(function (a, b) {
        return (a.period === b.period) ? 0 : (a.period < b.period) ? -1 : 1;
    });

    /**
     * Calculates the total of all payments over the term of the loan.
     *
     * @returns {number}
     */
    this.totalRepayments = function() {
        let total = 0;
        let lastLumpSumPeriod = 0;

        lumpSums.forEach(function (lumpSum) {
            total += (lumpSum.period - lastLumpSumPeriod) * repayment + lumpSum.amount;
            lastLumpSumPeriod = lumpSum.period;
        });

        return total +
            repayment * (this.periodsToZero() - lastLumpSumPeriod - 1) +
            this.amountOwing(this.periodsToZero() -1);
    };

    /**
     * Calculates the number of periods for the loan balance to reach $0.00.
     *
     * @returns {number}
     */
    this.periodsToZero = function (){
        let lastLumpSumPeriod = 0;
        let balance = principal;

        lumpSums.forEach(function (lumpSum) {
            balance = owing(balance, interestRate, repayment, lumpSum.period - lastLumpSumPeriod) - lumpSum.amount;
            lastLumpSumPeriod = lumpSum.period;
        });

        let remainingPeriods = periodsToZero(balance, interestRate, repayment);

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
    this.amountOwing = function(n) {
        let lastLumpSumPeriod = 0;
        let balance = principal;

        lumpSums.forEach(function (lumpSum) {
            if (lumpSum.period <= n) {
                balance = owing(balance, interestRate, repayment, lumpSum.period - lastLumpSumPeriod) - lumpSum.amount;
                lastLumpSumPeriod = lumpSum.period;
            }
        });

        return Math.max(0, owing(balance, interestRate, repayment, n - lastLumpSumPeriod));
    };

    this.totalInterest = this.totalRepayments() - principal;
}