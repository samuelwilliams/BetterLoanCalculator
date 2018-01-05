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
function Owing(P, I, R, n) {
    return P * I ** n - R * ( (1 - I ** n) / (1 - I) );
}

/**
 * Calculates the number of periods required before full repayment.
 *
 * @param P {number} Principal of the loan
 * @param I {number} The interest rate greater than 1, e.g. 4.59%, I = 1.0459
 * @param R {number} The periodic repayment amount.
 * @returns {number}
 * @constructor
 */
function PeriodsToZero(P, I, R) {
    return -Math.log( (P / R) * (1 - I) + 1 ) / Math.log(I);
}

/**
 * Calculates the minimum repayments required for a given number of periods.
 *
 * @param P {number} Principal
 * @param I {number} The interest rate greater than 1, e.g. 4.59%, I = 1.0459
 * @param n {number} Number of periods the loan is compounded over.
 * @returns {number}
 * @constructor
 */
function Repayments(P, I, n) {
    return (P * I ** n) * (1 - I) / (1 - I ** n);
}

/**
 * A once off loan repayment on a given date (loan period).
 *
 * @param period {number}
 * @param amount {number}
 * @param id
 * @constructor
 */
function LumpSum(period, amount, id) {
    this.id = (typeof id === 'undefined') ? '' : id;
    this.period = period;
    this.amount = amount;
}

/**
 * The application
 *
 * @param principal {number} The loan principal amount.
 * @param interestRate {number} The interest rate of the loan per compounding period.
 * @param repayment {number} Loan repayment each compounding period.
 * @param lumpSums {Array.<LumpSum>}
 * @constructor
 */
function Loan(principal, interestRate, repayment, lumpSums) {

    this.sortLumpSums = function() {
        lumpSums.sort(function (a, b) {
            return (a.period === b.period) ? 0 : (a.period < b.period) ? -1 : 1;
        });
    };

    /**
     * Calculates the total of all payments over the term of the loan.
     *
     * @returns {number}
     */
    this.TotalRepayments = function() {
        this.sortLumpSums();
        let total = 0;
        let lastLumpSumPeriod = 0;

        lumpSums.forEach(function (lumpSum) {
            total += (lumpSum.period - lastLumpSumPeriod) * repayment + lumpSum.amount;
            lastLumpSumPeriod = lumpSum.period;
        });

        return total + repayment * (this.PeriodsToZero() - lastLumpSumPeriod);
    };

    /**
     * Calculates the number of periods for the loan balance to reach $0.00.
     *
     * @returns {number}
     */
    this.PeriodsToZero = function (){
        this.sortLumpSums();

        let lastLumpSumPeriod = 0;
        let balance = principal;

        lumpSums.forEach(function (lumpSum) {
            balance = Owing(balance, interestRate, repayment, lumpSum.period - lastLumpSumPeriod) - lumpSum.amount;
            lastLumpSumPeriod = lumpSum.period;
        });

        let n = PeriodsToZero(balance, interestRate, repayment);

        if (Owing(balance, interestRate, repayment, n) > 0.01) n++;

        return n + lastLumpSumPeriod;
    };

    /**
     * Calculates the amount owing at some loan repayment period, n.
     *
     * @param n
     * @returns {number}
     * @constructor
     */
    this.AmountOwing = function(n) {
        this.sortLumpSums();

        let lastLumpSumPeriod = 0;
        let balance = principal;

        lumpSums.forEach(function (lumpSum) {
            if (lumpSum.period <= n) {
                balance = Owing(balance, interestRate, repayment, lumpSum.period - lastLumpSumPeriod) - lumpSum.amount;
                lastLumpSumPeriod = lumpSum.period;
            }
        });

        return Math.max(0, Owing(balance, interestRate, repayment, n - lastLumpSumPeriod));
    };

    this.TotalInterest = this.TotalRepayments() - principal;
}