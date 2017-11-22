# How Much Do My Cryptocurrencies Value

A dead simple crypto-balance calculator

## Why?

I recently started experimenting with _cryptocurrencies_ and I wanted to have a simple snippet that tells me my current, would-be balance — the current value of all my assets in their original buy-in _fiat_.

## How to use

1. Log your assets in the _assets.json_ (see the _example.json_ for help)
	- _crpytos_ should contain all your transactions
	- _fiats_ should show the remaining balance you have at the exchange(s)
2. Run `node index`

### Output with the _example.json_

```
                  50.00EUR
   51.00EUR ->    62.60EUR   +22.75%
-------------------------------------
                 112.60EUR

                 100.00USD
  500.00USD ->   816.30USD   +63.26%
-------------------------------------
                 916.30USD
```

## Disclaimer

This is only a snippet, nothing more. I was too lazy doing something else...
