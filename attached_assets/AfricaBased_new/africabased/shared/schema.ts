import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),
  isLocked: boolean("is_locked").default(false),
  role: text("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().references(() => users.id),
  incomeBalance: decimal("income_balance", { precision: 18, scale: 2 }).default("0"),
  walletBalance: decimal("wallet_balance", { precision: 18, scale: 2 }).default("0"),
  totalInvested: decimal("total_invested", { precision: 18, scale: 2 }).default("0"),
  totalEarnings: decimal("total_earnings", { precision: 18, scale: 2 }).default("0"),
  avatarUrl: text("avatar_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 18, scale: 2 }).notNull(),
  dailyIncome: decimal("daily_income", { precision: 18, scale: 2 }).notNull(),
  holdPeriod: integer("hold_period").notNull().default(30),
  category: text("category").default("standard"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const investments = pgTable("investments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  productId: varchar("product_id").references(() => products.id),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  dailyIncome: decimal("daily_income", { precision: 18, scale: 2 }).notNull(),
  holdPeriod: integer("hold_period").notNull(),
  status: text("status").default("active"),
  lastCollectedAt: timestamp("last_collected_at").defaultNow(),
  totalCollected: decimal("total_collected", { precision: 18, scale: 2 }).default("0"),
  investedAt: timestamp("invested_at").defaultNow(),
});

export const deposits = pgTable("deposits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  method: text("method").notNull().default("manual"),
  status: text("status").notNull().default("pending"),
  reference: text("reference"),
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const withdrawals = pgTable("withdrawals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  method: text("method").notNull().default("mpesa"),
  accountDetails: text("account_details"),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const referralEarnings = pgTable("referral_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  fromUserId: varchar("from_user_id").references(() => users.id),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  type: text("type").default("commission"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exchangeCodes = pgTable("exchange_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  isUsed: boolean("is_used").default(false),
  usedBy: varchar("used_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true, createdAt: true, referralCode: true, isLocked: true, role: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true, createdAt: true,
});

export const insertDepositSchema = createInsertSchema(deposits).omit({
  id: true, createdAt: true, processedAt: true, userId: true,
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true, createdAt: true, processedAt: true, userId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Profile = typeof profiles.$inferSelect;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Investment = typeof investments.$inferSelect;
export type Deposit = typeof deposits.$inferSelect;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type ReferralEarning = typeof referralEarnings.$inferSelect;
export type ExchangeCode = typeof exchangeCodes.$inferSelect;
