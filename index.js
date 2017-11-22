const request = require('request-promise')
const assets = require('./assets.json')

const precision = 2;
const padding = precision + 1 + 5;

Promise
	.all(assets.cryptos.map(getDetails))
	.then(aggregateAssets)
	.then(display)
	.catch(error => console.log)


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
			let ccy = fiat.toLocaleUpperCase()
			let remaining = padLeft(obj[fiat].remaining.toFixed(precision), padding * 2 + 7)
			let investment = padLeft(obj[fiat].investment.toFixed(precision))
			let value = padLeft(obj[fiat].value.toFixed(precision))
			let percentage = obj[fiat].profit / ( obj[fiat].investment / 100 )
			let sign = percentage > 0 ? '+' : ''
			percentage = padLeft(sign + percentage.toFixed(precision))
			let total = padLeft((obj[fiat].remaining + obj[fiat].value).toFixed(precision), padding * 2 + 7)

			console.log()
			console.log(`${remaining}${ccy}`)
			console.log(`${investment}${ccy} -> ${value}${ccy} ${percentage}%`)
			console.log(`${Array(padding * 3 + 13).fill('-').join('')}`)
			console.log(`${total}${ccy}`)
		})
}

function padLeft(str, pad = padding) {
	if (str.length >= pad) {
		return str;
	}

	return Array(pad - str.length).fill(' ').join('').concat(str)
}
