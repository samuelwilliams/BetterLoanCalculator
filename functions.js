/**
 * Caclulates the amount owing at period n.
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
 * Formats a number as a currency string.
 *
 * @example (1234567.890123).toCurrencyString() = $1,234,567.89
 *
 * @returns {string}
 */
Number.prototype.toCurrencyString = function() {
    return '$' + this.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 *
 * @param P
 * @param I
 * @param R
 * @param lumpSums
 * @returns {number}
 * @constructor
 */
function TotalRepayments(P, I, R, lumpSums) {
    lumpSums = (typeof lumpSums === 'undefined') ? [] : lumpSums;
    lumpSums.sort(function (a, b) {
        return (a.period === b.period) ? 0 : (a.period < b.period) ? -1 : 1;
    });

    let Total = 0;
    let lastLumpSumPeriod = 0;

    lumpSums.forEach(function (payment) {
        Total += (payment.period - lastLumpSumPeriod) * R + payment.amount;
        P = Owing(P, I, R, payment.period - lastLumpSumPeriod) - payment.amount;
        lastLumpSumPeriod = payment.period;
    });

    let n = PeriodsToZero(P, I, R);

    return Total + R * n + Owing(P, I, R, n);
}

/**
 *
 * @param P
 * @param I
 * @param R
 * @param lumpSums
 * @returns {number}
 * @constructor
 */
function _periodsToZero(P, I, R, lumpSums) {
    lumpSums = (typeof lumpSums === 'undefined') ? [] : lumpSums;
    lumpSums.sort(function (a, b) {
        return (a.period === b.period) ? 0 : (a.period < b.period) ? -1 : 1;
    });

    let lastLumpSumPeriod = 0;

    lumpSums.forEach(function (payment) {
        P = Owing(P, I, R, payment.period - lastLumpSumPeriod) - payment.amount;
        lastLumpSumPeriod = payment.period;
    });

    let n = PeriodsToZero(P, I, R);

    if (Owing(P, I, R, n) > 0.01) n++;

    return n + lastLumpSumPeriod;
}

function _AmountOwing(P, I, R, n, lumpSums) {
    lumpSums = (typeof lumpSums === 'undefined') ? [] : lumpSums;
    lumpSums.sort(function (a, b) {
        return (a.period === b.period) ? 0 : (a.period < b.period) ? -1 : 1;
    });

    let lastLumpSumPeriod = 0;

    lumpSums.forEach(function (lumpSum) {
        if (lumpSum.period <= n) {
            P = Owing(P, I, R, lumpSum.period - lastLumpSumPeriod) - lumpSum.amount;
            lastLumpSumPeriod = lumpSum.period;
        }
    });

    return Math.max(0, Owing(P, I, R, n - lastLumpSumPeriod));
}

/**
 *
 * @param period {number}
 * @param amount {number}
 * @param id
 * @constructor
 */
function LumpSum (period, amount, id) {
    this.id = (typeof id === 'undefined') ? '' : id;
    this.period = period;
    this.amount = amount;
}

/**
 *
 * @param P {number} Principal
 * @param I {number} The interest rate greater than 1, e.g. 4.59%, I = 1.0459
 * @param R {number} The periodic repayment amount.
 * @param n {number} Number of periods the loan is compounded over.
 * @param d_i {number}
 * @param lumpSums {[LumpSum]}
 * @returns {Array}
 */
function plotPayments(P, I, R, n, d_i, lumpSums) {
    d_i = (typeof d_i === 'undefined') ? 1 : d_i;
    lumpSums = (typeof lumpSums === 'undefined') ? [] : lumpSums;
    let vals = [];

    for (let i = 0; i <= n; i += d_i) {
        vals.push({
            x: i,
            y:  _AmountOwing(P, I, R, i, lumpSums)
        });
    }

    return vals;
}

/**
 *
 * @param Start {Date}
 * @param n {Number}
 * @param d_i {Number}
 * @returns {Array}
 */
function generateLabels(Start, n, d_i) {
    let labels = [];
    for (let i = 0; i <= n; i += d_i) {
        labels.push(Start.getFullYear());
        Start.setMonth(Start.getMonth() + d_i);
    }

    return labels;
}