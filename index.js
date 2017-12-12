const request = require('request-promise')
const assets = require('./assets.json')

const refreshRate = 1000 * 60 * 5

const precision = 2
const columnWidth = precision + 6
const columnShift = columnWidth * 2 + 7

processFlow()
setInterval(processFlow, refreshRate)

function getDetails(asset) {
	return request({
			url: `https://api.cryptowat.ch/markets/${asset.market}/${asset.crypto}${asset.fiat}/price`,
			json: true
		})
		.then(response => ({
			fiat: asset.fiat,
			crypto: asset.crypto,
			investment: asset.amount * asset.price,
			value: asset.amount * response.result.price,
			profit: asset.amount * response.result.price -
				asset.amount * asset.price
		}))
}

function clearConsole(responses) {
    process.stdout.write('\x1Bc')
    return responses
}

function displayIndividualIncrease(responses) {
    console.log()

    responses
        .forEach(obj => {
            let label = format(`${obj.crypto}-${obj.fiat}`.toUpperCase(), columnWidth + 3)
            let profit = format(obj.profit.toFixed(2))
            let percentage = obj.profit / ( obj.investment / 100 )
            percentage = format(percentage.toFixed(precision))

            console.log(`${label} -> ${profit}${obj.fiat.toUpperCase()} ${percentage}%`)
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
	Object
		.keys(obj)
		.forEach(fiat => {
            let o = obj[fiat]

            let ccy			= fiat.toUpperCase()
            let remaining	= format(o.remaining, columnShift)
            let investment	= format(o.investment)
            let value		= format(o.value)
            let difference	= format(o.value - o.investment, columnWidth, true)
            let percentage	= format(o.profit / (o.investment / 100), columnWidth, true)
            let total		= format(o.remaining + o.value, columnShift)

            let rows = [
                ``,
                `${remaining}${ccy}`,
                `${investment}${ccy} -> ${value}${ccy} ${difference}${ccy} ${percentage}%`,
                Array(columnWidth * 4 + 16).fill('-').join(''),
                `${total}${ccy}`
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
    } else {
        str = n.toString()
    }

	if (withSign && n > 0) {
		str = `+${n.toFixed(precision)}`
	}

	if (str.length >= padding) {
		return str;
	}

	return Array(padding - str.length).fill(' ').join('').concat(str)
}
