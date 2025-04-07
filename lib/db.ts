import { neon } from "@neondatabase/serverless"
import type { CurrencyCode } from "@/lib/utils"

// Initialize the database connection
const sql = neon(process.env.DATABASE_URL!)

// Helper functions for database operations
export async function getUserByEmail(email: string) {
  const result = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`
  return result[0] || null
}

export async function createUser(name: string, email: string, passwordHash: string) {
  const result = await sql`
INSERT INTO users (name, email, password_hash) 
VALUES (${name}, ${email}, ${passwordHash}) 
RETURNING *
`
  return result[0]
}

export async function createHousehold(name: string, userId: number) {
  // Create the household
  const household = await sql`
INSERT INTO households (name, created_by) 
VALUES (${name}, ${userId}) 
RETURNING *
`

  // Add the creator as an owner of the household
  await sql`
INSERT INTO household_members (household_id, user_id, role) 
VALUES (${household[0].id}, ${userId}, 'owner')
`

  return household[0]
}

export async function getHouseholdsByUserId(userId: number) {
  const result = await sql`
SELECT h.* FROM households h
JOIN household_members hm ON h.id = hm.household_id
WHERE hm.user_id = ${userId}
ORDER BY h.created_at DESC
`
  return result
}

export async function getHouseholdById(id: number) {
  const result = await sql`
SELECT * FROM households WHERE id = ${id} LIMIT 1
`
  return result[0] || null
}

export async function getHouseholdMembers(householdId: number) {
  const result = await sql`
SELECT u.id, u.name, u.email, hm.role, hm.joined_at
FROM household_members hm
JOIN users u ON hm.user_id = u.id
WHERE hm.household_id = ${householdId}
ORDER BY hm.role, u.name
`
  return result
}

export async function createInvitation(email: string, householdId: number, invitedBy: number, token: string) {
  // Set expiration to 7 days from now
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const result = await sql`
INSERT INTO invitations (email, household_id, invited_by, token, expires_at)
VALUES (${email}, ${householdId}, ${invitedBy}, ${token}, ${expiresAt})
RETURNING *
`

  return result[0]
}

export async function getInvitationByToken(token: string) {
  const result = await sql`
SELECT i.*, h.name as household_name, u.name as invited_by_name
FROM invitations i
JOIN households h ON i.household_id = h.id
JOIN users u ON i.invited_by = u.id
WHERE i.token = ${token} AND i.status = 'pending' AND i.expires_at > NOW()
LIMIT 1
`

  return result[0] || null
}

export async function getInvitationsByEmail(email: string) {
  const result = await sql`
SELECT i.*, h.name as household_name, u.name as invited_by_name
FROM invitations i
JOIN households h ON i.household_id = h.id
JOIN users u ON i.invited_by = u.id
WHERE i.email = ${email} AND i.status = 'pending' AND i.expires_at > NOW()
ORDER BY i.created_at DESC
`

  return result
}

export async function acceptInvitation(token: string, userId: number) {
  // Get the invitation
  const invitation = await sql`
SELECT * FROM invitations 
WHERE token = ${token} AND status = 'pending' AND expires_at > NOW() 
LIMIT 1
`

  if (!invitation[0]) {
    throw new Error("Invalid or expired invitation")
  }

  // Add user to household members
  await sql`
INSERT INTO household_members (household_id, user_id, role)
VALUES (${invitation[0].household_id}, ${userId}, 'member')
ON CONFLICT (household_id, user_id) DO NOTHING
`

  // Update invitation status
  await sql`
UPDATE invitations SET status = 'accepted' WHERE id = ${invitation[0].id}
`

  return invitation[0]
}

export async function rejectInvitation(token: string) {
  const result = await sql`
UPDATE invitations SET status = 'rejected' 
WHERE token = ${token} AND status = 'pending' 
RETURNING *
`

  return result[0] || null
}

// Property functions
export async function createProperty(
  householdId: number,
  name: string,
  address: string,
  price: number,
  currency: string,
  createdBy: number,
  maintenanceAmount = 0,
  yearlyTax = 0,
) {
  const result = await sql`
INSERT INTO properties (
  household_id, 
  name, 
  address, 
  price, 
  currency, 
  created_by,
  maintenance_amount,
  yearly_tax
)
VALUES (
  ${householdId}, 
  ${name}, 
  ${address}, 
  ${price}, 
  ${currency}, 
  ${createdBy},
  ${maintenanceAmount},
  ${yearlyTax}
)
RETURNING *
`
  return result[0]
}

export async function getPropertiesByHouseholdId(householdId: number) {
  const result = await sql`
SELECT p.*, u.name as created_by_name
FROM properties p
JOIN users u ON p.created_by = u.id
WHERE p.household_id = ${householdId}
ORDER BY p.created_at DESC
`
  return result
}

export async function getPropertyById(id: number) {
  const result = await sql`
SELECT p.*, u.name as created_by_name
FROM properties p
JOIN users u ON p.created_by = u.id
WHERE p.id = ${id}
LIMIT 1
`
  return result[0] || null
}

export async function updateProperty(
  id: number,
  name: string,
  address: string,
  price: number,
  currency: string,
  maintenanceAmount = 0,
  yearlyTax = 0,
) {
  const result = await sql`
UPDATE properties
SET 
  name = ${name},
  address = ${address},
  price = ${price},
  currency = ${currency},
  maintenance_amount = ${maintenanceAmount},
  yearly_tax = ${yearlyTax},
  updated_at = CURRENT_TIMESTAMP
WHERE id = ${id}
RETURNING *
`
  return result[0] || null
}

export async function deleteProperty(id: number) {
  const result = await sql`
DELETE FROM properties
WHERE id = ${id}
RETURNING *
`
  return result[0] || null
}

// Credit/Liability functions
export async function createCredit(
  householdId: number,
  name: string,
  description: string | null,
  totalAmount: number,
  remainingAmount: number,
  monthlyPayment: number,
  currency: string,
  createdBy: number,
) {
  const result = await sql`
INSERT INTO credits (
  household_id, 
  name, 
  description, 
  total_amount, 
  remaining_amount, 
  monthly_payment, 
  currency, 
  created_by
)
VALUES (
  ${householdId}, 
  ${name}, 
  ${description}, 
  ${totalAmount}, 
  ${remainingAmount}, 
  ${monthlyPayment}, 
  ${currency}, 
  ${createdBy}
)
RETURNING *
`
  return result[0]
}

export async function getCreditsByHouseholdId(householdId: number) {
  const result = await sql`
SELECT c.*, u.name as created_by_name
FROM credits c
JOIN users u ON c.created_by = u.id
WHERE c.household_id = ${householdId}
ORDER BY c.created_at DESC
`
  return result
}

export async function getCreditById(id: number) {
  const result = await sql`
SELECT c.*, u.name as created_by_name
FROM credits c
JOIN users u ON c.created_by = u.id
WHERE c.id = ${id}
LIMIT 1
`
  return result[0] || null
}

export async function updateCredit(
  id: number,
  name: string,
  description: string | null,
  totalAmount: number,
  remainingAmount: number,
  monthlyPayment: number,
  currency: string,
) {
  const result = await sql`
UPDATE credits
SET 
  name = ${name},
  description = ${description},
  total_amount = ${totalAmount},
  remaining_amount = ${remainingAmount},
  monthly_payment = ${monthlyPayment},
  currency = ${currency},
  updated_at = CURRENT_TIMESTAMP
WHERE id = ${id}
RETURNING *
`
  return result[0] || null
}

export async function deleteCredit(id: number) {
  const result = await sql`
DELETE FROM credits
WHERE id = ${id}
RETURNING *
`
  return result[0] || null
}

// Vehicle functions
export async function createVehicle(
  householdId: number,
  model: string,
  year: number,
  salePrice: number,
  maintenanceCosts: number,
  currency: string,
  createdBy: number,
) {
  const result = await sql`
INSERT INTO vehicles (
  household_id,
  model,
  year,
  sale_price,
  maintenance_costs,
  currency,
  created_by
)
VALUES (
  ${householdId},
  ${model},
  ${year},
  ${salePrice},
  ${maintenanceCosts},
  ${currency},
  ${createdBy}
)
RETURNING *
`
  return result[0]
}

export async function getVehiclesByHouseholdId(householdId: number) {
  const result = await sql`
SELECT v.*, u.name as created_by_name
FROM vehicles v
JOIN users u ON v.created_by = u.id
WHERE v.household_id = ${householdId}
ORDER BY v.created_at DESC
`
  return result
}

export async function getVehicleById(id: number) {
  const result = await sql`
SELECT v.*, u.name as created_by_name
FROM vehicles v
JOIN users u ON v.created_by = u.id
WHERE v.id = ${id}
LIMIT 1
`
  return result[0] || null
}

export async function updateVehicle(
  id: number,
  model: string,
  year: number,
  salePrice: number,
  maintenanceCosts: number,
  currency: string,
) {
  const result = await sql`
UPDATE vehicles
SET 
  model = ${model},
  year = ${year},
  sale_price = ${salePrice},
  maintenance_costs = ${maintenanceCosts},
  currency = ${currency},
  updated_at = CURRENT_TIMESTAMP
WHERE id = ${id}
RETURNING *
`
  return result[0] || null
}

export async function deleteVehicle(id: number) {
  const result = await sql`
DELETE FROM vehicles
WHERE id = ${id}
RETURNING *
`
  return result[0] || null
}

// Bank Account functions
export async function createBankAccount(
  householdId: number,
  name: string,
  bankName: string,
  amount: number,
  currency: string,
  createdBy: number,
  interestRate = 0,
) {
  const result = await sql`
INSERT INTO bank_accounts (
  household_id, 
  name, 
  bank_name, 
  amount, 
  currency, 
  created_by,
  interest_rate
)
VALUES (
  ${householdId}, 
  ${name}, 
  ${bankName}, 
  ${amount}, 
  ${currency}, 
  ${createdBy},
  ${interestRate}
)
RETURNING *
`
  return result[0]
}

export async function getBankAccountsByHouseholdId(householdId: number) {
  const result = await sql`
SELECT ba.*, u.name as created_by_name
FROM bank_accounts ba
JOIN users u ON ba.created_by = u.id
WHERE ba.household_id = ${householdId}
ORDER BY ba.created_at DESC
`
  return result
}

export async function getBankAccountById(id: number) {
  const result = await sql`
SELECT ba.*, u.name as created_by_name
FROM bank_accounts ba
JOIN users u ON ba.created_by = u.id
WHERE ba.id = ${id}
LIMIT 1
`
  return result[0] || null
}

export async function updateBankAccount(
  id: number,
  name: string,
  bankName: string,
  amount: number,
  currency: string,
  interestRate = 0,
) {
  const result = await sql`
UPDATE bank_accounts
SET 
  name = ${name},
  bank_name = ${bankName},
  amount = ${amount},
  currency = ${currency},
  interest_rate = ${interestRate},
  updated_at = CURRENT_TIMESTAMP
WHERE id = ${id}
RETURNING *
`
  return result[0] || null
}

export async function deleteBankAccount(id: number) {
  const result = await sql`
DELETE FROM bank_accounts
WHERE id = ${id}
RETURNING *
`
  return result[0] || null
}

// Stock functions
export async function createStock(
  householdId: number,
  symbol: string,
  companyName: string,
  shares: number,
  currentPrice: number | null,
  purchasePrice: number | null,
  purchaseDate: Date | null,
  dividendYield: number | null,
  dividendFrequency: string | null,
  notes: string | null,
  createdBy: number,
) {
  const result = await sql`
  INSERT INTO stocks (
    household_id,
    symbol,
    company_name,
    shares,
    current_price,
    purchase_price,
    purchase_date,
    dividend_yield,
    dividend_frequency,
    notes,
    created_by
  )
  VALUES (
    ${householdId},
    ${symbol.toUpperCase()},
    ${companyName},
    ${shares},
    ${currentPrice},
    ${purchasePrice},
    ${purchaseDate},
    ${dividendYield},
    ${dividendFrequency},
    ${notes},
    ${createdBy}
  )
  RETURNING *
  `
  return result[0]
}

export async function getStocksByHouseholdId(householdId: number) {
  const result = await sql`
SELECT s.*, u.name as created_by_name
FROM stocks s
JOIN users u ON s.created_by = u.id
WHERE s.household_id = ${householdId}
ORDER BY s.symbol ASC
`
  return result
}

export async function getStockById(id: number) {
  const result = await sql`
SELECT s.*, u.name as created_by_name
FROM stocks s
JOIN users u ON s.created_by = u.id
WHERE s.id = ${id}
LIMIT 1
`
  return result[0] || null
}

export async function updateStock(
  id: number,
  symbol: string,
  companyName: string,
  shares: number,
  currentPrice: number | null,
  purchasePrice: number | null,
  purchaseDate: Date | null,
  dividendYield: number | null,
  dividendFrequency: string | null,
  notes: string | null,
) {
  const result = await sql`
UPDATE stocks
SET 
  symbol = ${symbol.toUpperCase()},
  company_name = ${companyName},
  shares = ${shares},
  current_price = ${currentPrice},
  purchase_price = ${purchasePrice},
  purchase_date = ${purchaseDate},
  dividend_yield = ${dividendYield},
  dividend_frequency = ${dividendFrequency},
  notes = ${notes},
  updated_at = CURRENT_TIMESTAMP
WHERE id = ${id}
RETURNING *
`
  return result[0] || null
}

export async function deleteStock(id: number) {
  const result = await sql`
DELETE FROM stocks
WHERE id = ${id}
RETURNING *
`
  return result[0] || null
}

// Currency functions
export async function getUserDefaultCurrency(userId: number) {
  const result = await sql`
  SELECT default_currency FROM users WHERE id = ${userId}
`
  return result[0]?.default_currency || "USD"
}

export async function updateUserDefaultCurrency(userId: number, currency: CurrencyCode) {
  const result = await sql`
  UPDATE users
  SET default_currency = ${currency}
  WHERE id = ${userId}
  RETURNING default_currency
`
  return result[0]
}

export async function getCurrencyRates() {
  const result = await sql`
  SELECT * FROM currency_rates
  ORDER BY from_currency, to_currency
`
  return result
}

export async function getCurrencyRate(fromCurrency: CurrencyCode, toCurrency: CurrencyCode) {
  // If currencies are the same, return 1
  if (fromCurrency === toCurrency) {
    return { rate: 1 }
  }

  const result = await sql`
  SELECT rate FROM currency_rates
  WHERE from_currency = ${fromCurrency} AND to_currency = ${toCurrency}
  LIMIT 1
`
  return result[0] || null
}

export async function updateCurrencyRate(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rate: number,
  userId: number,
) {
  const result = await sql`
  INSERT INTO currency_rates (from_currency, to_currency, rate, created_by)
  VALUES (${fromCurrency}, ${toCurrency}, ${rate}, ${userId})
  ON CONFLICT (from_currency, to_currency) 
  DO UPDATE SET 
    rate = ${rate},
    updated_at = CURRENT_TIMESTAMP
  RETURNING *
`
  return result[0]
}

export async function deleteCurrencyRate(fromCurrency: CurrencyCode, toCurrency: CurrencyCode) {
  const result = await sql`
  DELETE FROM currency_rates
  WHERE from_currency = ${fromCurrency} AND to_currency = ${toCurrency}
  RETURNING *
`
  return result[0] || null
}

// Subscription functions
export async function createSubscription(
  householdId: number,
  name: string,
  description: string | null,
  price: number,
  currency: string,
  billingCycle: string,
  priority: string,
  createdBy: number,
) {
  const result = await sql`
    INSERT INTO subscriptions (
      household_id,
      name,
      description,
      price,
      currency,
      billing_cycle,
      priority,
      created_by
    )
    VALUES (
      ${householdId},
      ${name},
      ${description},
      ${price},
      ${currency},
      ${billingCycle},
      ${priority},
      ${createdBy}
    )
    RETURNING *
  `
  return result[0]
}

export async function getSubscriptionsByHouseholdId(householdId: number) {
  const result = await sql`
    SELECT s.*, u.name as created_by_name
    FROM subscriptions s
    JOIN users u ON s.created_by = u.id
    WHERE s.household_id = ${householdId}
    ORDER BY s.priority DESC, s.name ASC
  `
  return result
}

export async function getSubscriptionById(id: number) {
  const result = await sql`
    SELECT s.*, u.name as created_by_name
    FROM subscriptions s
    JOIN users u ON s.created_by = u.id
    WHERE s.id = ${id}
    LIMIT 1
  `
  return result[0] || null
}

export async function updateSubscription(
  id: number,
  name: string,
  description: string | null,
  price: number,
  currency: string,
  billingCycle: string,
  priority: string,
) {
  const result = await sql`
    UPDATE subscriptions
    SET 
      name = ${name},
      description = ${description},
      price = ${price},
      currency = ${currency},
      billing_cycle = ${billingCycle},
      priority = ${priority},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `
  return result[0] || null
}

export async function deleteSubscription(id: number) {
  const result = await sql`
    DELETE FROM subscriptions
    WHERE id = ${id}
    RETURNING *
  `
  return result[0] || null
}

// Passive Income functions
export async function createPassiveIncome(
  householdId: number,
  name: string,
  amount: number,
  frequency: string,
  currency: string,
  createdBy: number,
  description: string | null = null,
  category: string | null = null,
  isTaxable = true,
  startDate: Date | null = null,
  endDate: Date | null = null,
) {
  const result = await sql`
    INSERT INTO passive_income (
      household_id,
      name,
      description,
      amount,
      frequency,
      currency,
      category,
      is_taxable,
      start_date,
      end_date,
      created_by
    )
    VALUES (
      ${householdId},
      ${name},
      ${description},
      ${amount},
      ${frequency},
      ${currency},
      ${category},
      ${isTaxable},
      ${startDate},
      ${endDate},
      ${createdBy}
    )
    RETURNING *
  `
  return result[0]
}

export async function getPassiveIncomeByHouseholdId(householdId: number) {
  const result = await sql`
    SELECT pi.*, u.name as created_by_name
    FROM passive_income pi
    JOIN users u ON pi.created_by = u.id
    WHERE pi.household_id = ${householdId}
    ORDER BY pi.amount DESC, pi.name ASC
  `
  return result
}

export async function getPassiveIncomeById(id: number) {
  const result = await sql`
    SELECT pi.*, u.name as created_by_name
    FROM passive_income pi
    JOIN users u ON pi.created_by = u.id
    WHERE pi.id = ${id}
    LIMIT 1
  `
  return result[0] || null
}

export async function updatePassiveIncome(
  id: number,
  name: string,
  amount: number,
  frequency: string,
  currency: string,
  description: string | null = null,
  category: string | null = null,
  isTaxable = true,
  startDate: Date | null = null,
  endDate: Date | null = null,
) {
  const result = await sql`
    UPDATE passive_income
    SET 
      name = ${name},
      description = ${description},
      amount = ${amount},
      frequency = ${frequency},
      currency = ${currency},
      category = ${category},
      is_taxable = ${isTaxable},
      start_date = ${startDate},
      end_date = ${endDate},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `
  return result[0] || null
}

export async function deletePassiveIncome(id: number) {
  const result = await sql`
    DELETE FROM passive_income
    WHERE id = ${id}
    RETURNING *
  `
  return result[0] || null
}

// Investment functions
export async function createInvestment(
  householdId: number,
  type: string,
  name: string,
  amount: number,
  currency: string,
  createdBy: number,
  description: string | null = null,
  purchaseDate: Date | null = null,
  currentValue: number | null = null,
  metadata: any = {},
) {
  const result = await sql`
    INSERT INTO investments (
      household_id,
      type,
      name,
      amount,
      currency,
      created_by,
      description,
      purchase_date,
      current_value,
      metadata
    )
    VALUES (
      ${householdId},
      ${type},
      ${name},
      ${amount},
      ${currency},
      ${createdBy},
      ${description},
      ${purchaseDate},
      ${currentValue},
      ${JSON.stringify(metadata)}
    )
    RETURNING *
  `
  return result[0]
}

export async function getInvestmentsByHouseholdId(householdId: number) {
  const result = await sql`
    SELECT i.*, u.name as created_by_name
    FROM investments i
    JOIN users u ON i.created_by = u.id
    WHERE i.household_id = ${householdId}
    ORDER BY i.created_at DESC
  `
  return result
}

export async function getInvestmentById(id: number) {
  const result = await sql`
    SELECT i.*, u.name as created_by_name
    FROM investments i
    JOIN users u ON i.created_by = u.id
    WHERE i.id = ${id}
    LIMIT 1
  `
  return result[0] || null
}

export async function updateInvestment(
  id: number,
  type: string,
  name: string,
  amount: number,
  currency: string,
  description: string | null = null,
  purchaseDate: Date | null = null,
  currentValue: number | null = null,
  metadata: any = {},
) {
  const result = await sql`
    UPDATE investments
    SET 
      type = ${type},
      name = ${name},
      amount = ${amount},
      currency = ${currency},
      description = ${description},
      purchase_date = ${purchaseDate},
      current_value = ${currentValue},
      metadata = ${JSON.stringify(metadata)},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `
  return result[0] || null
}

export async function deleteInvestment(id: number) {
  const result = await sql`
    DELETE FROM investments
    WHERE id = ${id}
    RETURNING *
  `
  return result[0] || null
}

