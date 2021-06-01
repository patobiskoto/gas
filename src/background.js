var appData = {
  gasData: {}
};

chrome.alarms.create('fetch_gas_price',{
  "periodInMinutes": 2
});

chrome.alarms.onAlarm.addListener(alarm => {
  fetchGasPrice();
});

function updateBadge() {
  chrome.storage.sync.get({
    gasPriceOption: "standard",
  }, function(items) {
    const gasPrice = appData.gasData[items.gasPriceOption].gwei;
    chrome.browserAction.setBadgeText({text: String(gasPrice)});
  });
}

function getProviderUrl(provider) {
  switch(provider) {
    case 'ethgasstation':
      return "https://ethgasstation.info/api/ethgasAPI.json?api-key=d216b81e8ed8f5c8a82744be99b22b2d1757098f40df3c2ea5bb40b3912b";
      break;
    case 'gasnow':
      return "https://www.gasnow.org/api/v3/gas/price?utm_source=EthGasPriceExtension";
      break;
    case 'ethgaswatch':
      return "https://gasprice-proxy.herokuapp.com/provider/ethgaswatch";
      break;
  }
}

function fetchGasPrice() {
  return new Promise((resolve, reject)=>{
    chrome.storage.sync.get({
      provider: "ethgasstation",
    }, function(items) {
      const url = getProviderUrl(items.provider);

      fetch(url).then((res) => {return res.json()})
      .then(data => {
        appData.gasData = parseApiData(data, items.provider);
        updateBadge();
        resolve();
      })
      .catch((error) => {
        reject();
      });
    });
  });
}

function parseApiData(apiData, provider) {
  if(provider === "ethgasstation") {
    return {
      "slow": {
        "gwei": parseInt(apiData.safeLow, 10)/10,
        "wait": "~"+apiData.safeLowWait + " minutes"
      },
      "standard": {
        "gwei": parseInt(apiData.average, 10)/10,
        "wait": "~"+apiData.avgWait + " minutes"
      },
      "fast": {
        "gwei": parseInt(apiData.fast, 10)/10,
        "wait": "~"+apiData.fastWait + " minutes"
      },
      "rapid": {
        "gwei": parseInt(apiData.fastest, 10)/10,
        "wait": "~"+apiData.fastestWait + " minutes"
      }
    }
  }

  if(provider === "gasnow") {
    return {
      "slow": {
        "gwei": Math.floor(parseInt(apiData.data.slow, 10)/1000000000),
        "wait": ">10 minutes"
      },
      "standard": {
        "gwei": Math.floor(parseInt(apiData.data.standard, 10)/1000000000),
        "wait": "~3 minutes"
      },
      "fast": {
        "gwei": Math.floor(parseInt(apiData.data.fast, 10)/1000000000),
        "wait": "~1 minute"
      },
      "rapid": {
        "gwei": Math.floor(parseInt(apiData.data.rapid, 10)/1000000000),
        "wait": "~15 seconds"
      }
    }
  }

  if(provider === "ethgaswatch") {
    return {
      "slow": {
        "gwei": parseInt(apiData.slow.gwei, 10),
        "wait": "<30 minutes"
      },
      "standard": {
        "gwei": parseInt(apiData.normal.gwei, 10),
        "wait": "<5 minutes"
      },
      "fast": {
        "gwei": parseInt(apiData.fast.gwei, 10),
        "wait": "<2 minutes"
      },
      "rapid": {
        "gwei": parseInt(apiData.instant.gwei, 10),
        "wait": "few seconds"
      }
    }
  }

}

fetchGasPrice(); // Initial fetch
