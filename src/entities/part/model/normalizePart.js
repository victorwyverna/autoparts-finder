const unavailableOffer = {
  warehouse: null,
  price: null,
  stock: 0,
  shipmentDate: null,
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeOffer(warehouse) {
  if (!isRecord(warehouse) || !isNonEmptyString(warehouse.id)) {
    return null
  }

  return {
    warehouse: {
      id: warehouse.id,
      code: isNonEmptyString(warehouse.code) ? warehouse.code : null,
      own: typeof warehouse.own === 'boolean' ? warehouse.own : null,
    },
    price:
      typeof warehouse.price === 'number' && Number.isFinite(warehouse.price)
        ? warehouse.price
        : null,
    stock:
      Number.isInteger(warehouse.stock) && warehouse.stock >= 0
        ? warehouse.stock
        : 0,
    shipmentDate: isNonEmptyString(warehouse.shipmentDate)
      ? warehouse.shipmentDate
      : null,
  }
}

function normalizePart(good, isAnalogue) {
  if (
    !isRecord(good) ||
    !isNonEmptyString(good.goodsID) ||
    !isNonEmptyString(good.name) ||
    !isNonEmptyString(good.brand) ||
    !isNonEmptyString(good.number)
  ) {
    return null
  }

  const offers = Array.isArray(good.warehouses)
    ? good.warehouses.map(normalizeOffer).filter(Boolean)
    : []

  return {
    part: {
      goodsID: good.goodsID,
      name: good.name,
      brand: good.brand,
      number: good.number,
      isAnalogue,
    },
    offers,
  }
}

function hasSameIdentity(left, right) {
  return (
    left.goodsID === right.goodsID &&
    left.name === right.name &&
    left.brand === right.brand &&
    left.number === right.number &&
    left.isAnalogue === right.isAnalogue
  )
}

export function getManufacturerOptions(goods) {
  if (!Array.isArray(goods)) {
    return []
  }

  const options = new Map()

  for (const good of goods) {
    if (
      !isRecord(good) ||
      !isNonEmptyString(good.brand) ||
      !isNonEmptyString(good.number)
    ) {
      continue
    }

    const key = JSON.stringify([good.brand, good.number])

    if (!options.has(key)) {
      options.set(key, { brand: good.brand, number: good.number })
    }
  }

  return [...options.values()]
}

export function normalizeParts(goods) {
  if (!Array.isArray(goods)) {
    return []
  }

  const normalizedParts = new Map()

  function addPart(good, isAnalogue) {
    const normalized = normalizePart(good, isAnalogue)

    if (!normalized) {
      return
    }

    const partKey = JSON.stringify([isAnalogue, normalized.part.goodsID])
    let entry = normalizedParts.get(partKey)

    if (!entry) {
      entry = { part: normalized.part, offers: [], offerKeys: new Set() }
      normalizedParts.set(partKey, entry)
    } else if (!hasSameIdentity(entry.part, normalized.part)) {
      return
    }

    for (const offer of normalized.offers) {
      const offerKey = JSON.stringify(offer)

      if (!entry.offerKeys.has(offerKey)) {
        entry.offerKeys.add(offerKey)
        entry.offers.push(offer)
      }
    }
  }

  for (const good of goods) {
    addPart(good, false)

    if (!isRecord(good) || !Array.isArray(good.analogues)) {
      continue
    }

    for (const analogue of good.analogues) {
      addPart(analogue, true)
    }
  }

  return [...normalizedParts.values()].map(({ part, offers }) => ({
    ...part,
    offers: offers.length > 0 ? offers : [{ ...unavailableOffer }],
  }))
}
