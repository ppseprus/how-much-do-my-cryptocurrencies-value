const fetch = require('node-fetch')

// the actual assets are stored in a private gist on github
const assets = require('../assets/assets.json')

const refreshRate = 1000 * 60 * 5

const fiatLabel = 3
const fiatPrecision = 2
const fiatColumn = fiatPrecision + 7

const cryptoLabel = 5
const cryptoPrecision = 5
const cryptoColumn = cryptoPrecision + 6

const percentPrecision = 2
const percentColumn = percentPrecision + 5

const columnShift = cryptoColumn + cryptoLabel + 3 + cryptoColumn + fiatLabel + 3 + fiatColumn + 4

processFlow()
setInterval(processFlow, refreshRate)

function getDetails(asset) {
    return fetch(`https://api.cryptowat.ch/markets/${asset.market}/${asset.crypto}${asset.fiat}/price`, {
            method: 'GET',
            headers: {
                'User-Agent': 'ppseprus:how-much-do-my-cryptocurrencies-value'
            }
        })
        .then(httpResponse => httpResponse.json())
		.then(response => ({
            ...asset,
            price: asset.price || 0,
            currentPrice: response.result.price,
            investment: asset.amount * (asset.price || 0),
            value: asset.amount * response.result.price,
            profit: asset.amount * response.result.price -
                asset.amount * (asset.price || 0)
        }))
        .catch(errorHandler)
}

function filterEmpty(responses) {
    return responses
        .filter(obj => obj !== undefined)
        .filter(obj => obj !== null)
}

function clearConsole(responses) {
    process.stdout.write('\x1Bc')
    console.log(color(new Date().toISOString()).dim)
    console.log(color(`response success rate: ${(responses.length / (assets.cryptos.length / 100)).toFixed(2)}%`).dim)
    return responses
}

function displayColumnHeaders(responses) {
    let headers = ''
    headers += 'QTY'.padStart(cryptoColumn).padEnd(cryptoColumn + cryptoLabel + 3)
    headers += 'PRICE'.padStart(cryptoColumn).padEnd(cryptoColumn + fiatLabel + 3)
    headers += 'INV'.padStart(fiatColumn).padEnd(fiatColumn + 4)
    headers += 'VALUE'.padStart(fiatColumn).padEnd(fiatColumn + fiatLabel + 1)
    headers += 'CHNG'.padStart(percentColumn).padEnd(percentColumn + 4)

    console.log()
    console.log(headers)

    return responses
}

function displayIndividualIncrease(responses) {
    let last
    let cumulative = {}

    function printCumulative() {
        if (cumulative.amount && cumulative.price && cumulative.investment && cumulative.profit) {

            let amount = `${format(cumulative.amount, cryptoPrecision, cryptoColumn)}`
            let price = `${format(cumulative.price, cryptoPrecision, cryptoColumn)}`
            let value = format(cumulative.amount * cumulative.price, fiatPrecision, fiatColumn)
            let profit = color(format(cumulative.profit, fiatPrecision, fiatColumn, true)).bright
            let increase = cumulative.profit / ( cumulative.investment / 100 )
            increase = format(increase, percentPrecision, percentColumn, true)

            console.log(Array(columnShift + fiatColumn + fiatLabel + percentColumn + 2).fill('-').join(''))
            console.log(`${amount}${cumulative.crypto} ${color('@').dim} ${price}${cumulative.ccy} ${color('=').dim} ${value}    ${profit}${cumulative.ccy} ${increase}${color('%').dim}`)
        }
    }

    responses
        .forEach(obj => {
            if (last !== obj.crypto) {
                printCumulative()

                console.log()

                last = obj.crypto
                cumulative = {
                    amount: 0,
                    price: 0,
                    investment: 0,
                    profit: 0,
                    crypto: '',
                    ccy: ''
                }
            }

            let crypto = color(obj.crypto.toUpperCase().padEnd(cryptoLabel)).dim
            let ccy = color(obj.fiat.toUpperCase().padEnd(fiatLabel)).dim

            let amount = `${format(obj.amount, cryptoPrecision, cryptoColumn)}`
            let price = `${format(obj.price, cryptoPrecision, cryptoColumn)}`
            let investment = format(obj.investment, fiatPrecision, fiatColumn)
            let profit = color(format(obj.profit, fiatPrecision, fiatColumn, true)).bright

            let increase = obj.profit / ( obj.investment / 100 )
            increase = format(increase, percentPrecision, percentColumn, true)

            cumulative.amount += obj.amount
            cumulative.price = obj.currentPrice
            cumulative.investment += obj.investment
            cumulative.profit += obj.profit
            cumulative.crypto = crypto
            cumulative.ccy = ccy

            if (obj.price === 0) {
                price = format('')
                //console.log(`${amount}${crypto}   ${price}      ${investment} ${color('>>').dim} ${profit}${ccy}`)
                return
            }

            console.log(`${amount}${crypto} ${color('@').dim} ${price}${ccy} ${color('=').dim} ${investment} ${color('>>').dim} ${profit}${ccy} ${increase}${color('%').dim}`)
        })

    printCumulative()

    return responses
}

function aggregateAssets(responses) {
    return responses
		.reduce((obj, { fiat, investment, value, profit }) => {
			if (!obj.hasOwnProperty(fiat)) {
				obj[fiat] = {
					remaining: 0,
					investment: 0,
					value: 0,
					profit: 0
				}

				if (assets.fiats.hasOwnProperty(fiat)) {
					obj[fiat].remaining = assets.fiats[fiat]
				}
			}

			obj[fiat].investment += investment
			obj[fiat].value += value
			obj[fiat].profit += profit

			return obj

		}, {})
}

function display(obj) {
    if (Object.keys(obj).length === 0) {
        console.log(`Service unavailable`)
        return obj
    }

	Object
		.keys(obj)
		.forEach(fiat => {
            let o = obj[fiat]

            let ccy			= fiat.toUpperCase()

            let remaining	= format(o.remaining, fiatPrecision, fiatColumn)
            let investment	= color(format(o.investment, fiatPrecision, fiatColumn)).bright
            let difference	= color(format(o.value - o.investment, fiatPrecision, fiatColumn, true)).bright
            let increase	= color(format(o.profit / (o.investment / 100), percentPrecision, percentColumn, true)).fgCyan
            let total		= color(format(o.remaining + o.value, fiatPrecision, fiatColumn)).bright

            let rows = [
                ``,
                ``,
                `${'WALLET FIAT    '.padStart(columnShift)}${remaining}${color(ccy).dim}`,
                `${'INVESTMENT    '.padStart(columnShift)}${investment}${color(ccy).dim}`,
                `${'PROFIT    '.padStart(columnShift)}${difference}${color(ccy).dim} ${increase}${color('%').dim}`,
                Array(columnShift + fiatColumn + fiatLabel + percentColumn + 2).fill('=').join(''),
                `${'EXIT VALUE    '.padStart(columnShift)}${total}${color(ccy).dim}`
            ]

            rows.forEach(row => console.log(row))
        })

    return obj
}

function errorHandler(errorStack) {
    if (errorStack.error) {
        console.log(errorStack.error.error)
    } else {
        console.log(errorStack)
    }
}

function processFlow() {
    Promise
        .all(assets.cryptos.map(getDetails))
        .then(filterEmpty)
        .then(clearConsole)
        .then(displayColumnHeaders)
        .then(displayIndividualIncrease)
        .then(aggregateAssets)
        .then(display)
        .catch(errorHandler)
}

function format(n, precision, column, withSign = false) {
    let str
    if (n.toFixed) {
        str = n.toFixed(precision)
        if (withSign && n > 0) {
            str = `+${n.toFixed(precision)}`
        }
    } else {
        str = n.toString()
    }

	if (str.length >= column) {
		return str;
	}

	return str.padStart(column)
}

function color(text) {
    const reset = '\x1b[0m'
    return {
        bright: `\x1b[1m${text}${reset}`,
        dim: `\x1b[2m${text}${reset}`,
        fgCyan: `\x1b[36m${text}${reset}`
    }
}
