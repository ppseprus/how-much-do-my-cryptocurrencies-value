const request = require('request-promise')

// the actual assets are stored in a private gist on github
const assets = require('../assets/assets.json')

const refreshRate = 1000 * 60 * 5

const precision = 2
const columnWidth = precision + 6
const columnShift = columnWidth * 2 + 34

processFlow()
setInterval(processFlow, refreshRate)

function getDetails(asset) {
    return request({
			url: `https://api.cryptowat.ch/markets/${asset.market}/${asset.crypto}${asset.fiat}/price`,
			json: true
        })
		.then(response => ({
            ...asset,
            investment: asset.amount * asset.price,
            value: asset.amount * response.result.price,
            profit: asset.amount * response.result.price -
                asset.amount * asset.price
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
    console.log(color(`response success rate: ${responses.length / (assets.cryptos.length / 100)}%`).dim)
    return responses
}

function displayIndividualIncrease(responses) {
    let previousCrypto

    responses
        .forEach(obj => {
            if (previousCrypto != obj.crypto) {
                console.log()
                previousCrypto = obj.crypto;
            }

            let amount = format(`${obj.amount.toFixed(3)}`, 9)
            let price = format(`${obj.price.toFixed(3)}`, 9)
            let investment = format(obj.investment)
            let profit = color(format(obj.profit, columnWidth, true)).bright
            let increase = obj.profit / ( obj.investment / 100 )
            increase = format(increase, columnWidth, true)

            console.log(`${amount}${color(obj.crypto.toUpperCase()).dim} ${color('@').dim} ${price}${color(obj.fiat.toUpperCase()).dim} ${color('=').dim} ${investment} ${color('->').dim} ${profit}${color(obj.fiat.toUpperCase()).dim} ${increase}${color('%').dim}`)
        })

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
            let remaining	= format(o.remaining, columnShift)
            let investment	= color(format(o.investment, columnShift)).bright
            //let value		= color(format(o.value, columnShift)).bright
            let difference	= color(format(o.value - o.investment, columnShift, true)).bright
            let increase	= color(format(o.profit / (o.investment / 100), columnWidth, true)).fgCyan
            let total		= color(format(o.remaining + o.value, columnShift)).bright

            let rows = [
                ``,
                ``,
                `${remaining}${color(ccy).dim}`,
                `${investment}${color(ccy).dim}`,
                `${difference}${color(ccy).dim} ${increase}${color('%').dim}`,
                //`${value}${color(ccy).dim}`,
                Array(columnWidth * 4 + 31).fill('-').join(''),
                `${total}${color(ccy).dim}`
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
        .then(displayIndividualIncrease)
        .then(aggregateAssets)
        .then(display)
        .catch(errorHandler)
}

function format(n, padding = columnWidth, withSign = false) {
    let str
    if (n.toFixed) {
        str = n.toFixed(precision)
        if (withSign && n > 0) {
            str = `+${n.toFixed(precision)}`
        }
    } else {
        str = n.toString()
    }

	if (str.length >= padding) {
		return str;
	}

	return Array(padding - str.length).fill(' ').join('').concat(str)
}

function color(text) {
    const reset = '\x1b[0m'
    return {
        bright: `\x1b[1m${text}${reset}`,
        dim: `\x1b[2m${text}${reset}`,
        fgCyan: `\x1b[36m${text}${reset}`
    }
}
