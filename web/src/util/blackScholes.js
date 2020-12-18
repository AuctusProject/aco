export const blackScholesData = (underlyingPrice, strikePrice, expiryTime, isCall, volatility, interestRate) => {
    const normalizedExpiryTime = (expiryTime - Date.now()) / 1000 / 86400 / 365;
    const base = volatility * Math.sqrt(normalizedExpiryTime); 
    const d1 = (Math.log(underlyingPrice/strikePrice) + normalizedExpiryTime * (interestRate + (Math.pow(volatility, 2) / 2))) / base;
    const d2 = d1 - base;
    const nd1 = normal(d1, 0, 1);
    let delta, price;
    if (isCall) {
      delta = nd1;
      const nd2 = normal(d2, 0, 1);
      price = underlyingPrice * nd1 - strikePrice * nd2 * Math.exp(-interestRate*normalizedExpiryTime);
    } else {
      delta = nd1 - 1;
      const nnd1 = normal(-d1, 0, 1);
      const nnd2 = normal(-d2, 0, 1);
      price = strikePrice * nnd2 * Math.exp(-interestRate*normalizedExpiryTime) - underlyingPrice * nnd1;
    }
    return {
      price: price,
      delta: delta
    };
  };
  
  const normal = (x, mu, sigma) => {
    return stdNormal((x-mu)/sigma);
  };
  
  const stdNormal = (z) => {
    var k, m, values, total, item, z2, z4, a, b;
  
    // Power series is not stable at these extreme tail scenarios
    if (z < -6) { return 0; }
    if (z >  6) { return 1; }
  
    m      = 1;        // m(k) == (2**k)/factorial(k)
    b      = z;        // b(k) == z ** (2*k + 1)
    z2     = z * z;    // cache of z squared
    z4     = z2 * z2;  // cache of z to the 4th
    values = [];
  
    // Compute the power series in groups of two terms.
    // This reduces floating point errors because the series
    // alternates between positive and negative.
    for (k=0; k<100; k+=2) {
      a = 2*k + 1;
      item = b / (a*m);
      item *= (1 - (a*z2)/((a+1)*(a+2)));
      values.push(item);
      m *= (4*(k+1)*(k+2));
      b *= z4;
    }
  
    // Add the smallest terms to the total first that
    // way we minimize the floating point errors.
    total = 0;
    for (k=49; k>=0; k--) {
      total += values[k];
    }
  
    // Multiply total by 1/sqrt(2*PI)
    // Then add 0.5 so that stdNormal(0) === 0.5
    return 0.5 + 0.3989422804014327 * total;
  }; 