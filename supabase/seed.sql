-- MetroGlassOps Seed Data
-- Sample data for testing and demonstration

-- ============================================
-- SAMPLE CLIENTS
-- ============================================

INSERT INTO clients (id, name, email, phone, billing_address, notes) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'ABC Design Firm', 'contact@abcdesign.com', '212-555-1234', '456 Park Ave, Suite 200, New York, NY 10022', 'Long-term client. Always pays on time. Prefers email communication.'),
  ('c1000000-0000-0000-0000-000000000002', 'Luxury Renovations LLC', 'projects@luxuryreno.com', '917-555-5678', '789 Madison Ave, New York, NY 10065', 'High-end residential projects. Requires COI for buildings.'),
  ('c1000000-0000-0000-0000-000000000003', 'Smith Family', 'john.smith@email.com', '646-555-9012', '123 Main Street, Apt 4B, Brooklyn, NY 11201', 'Referred by ABC Design. Great experience.'),
  ('c1000000-0000-0000-0000-000000000004', 'Jersey Shore Contractors', 'info@jerseyshorecontract.com', '973-555-3456', '567 Ocean Blvd, Jersey City, NJ 07302', 'Multiple projects in NJ. Net 15 terms agreed.');

-- ============================================
-- SAMPLE JOBS
-- ============================================

INSERT INTO jobs (id, client_id, job_name, address, area, status, install_date, install_end_date, notes) VALUES
  ('j1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Johnson Master Bath', '123 Park Ave, Unit 15A, Manhattan', 'Manhattan', 'ordered', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '6 days', 'Frameless shower enclosure, 3/8" clear glass. Client prefers morning installation.'),
  ('j1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'Chen Penthouse Shower', '456 Fifth Ave, PH1, Manhattan', 'Manhattan', 'measured', CURRENT_DATE + INTERVAL '12 days', NULL, 'Custom curved glass panel. Ultra-clear low-iron glass requested. Premium hardware.'),
  ('j1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'Smith Guest Bathroom', '123 Main Street, Apt 4B, Brooklyn', 'Brooklyn', 'deposit_received', NULL, NULL, 'Standard sliding door. Budget-conscious, recommend 5/16" glass.'),
  ('j1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 'Rivera Condo Master', '789 Hudson St, Unit 8C, Jersey City', 'Jersey City', 'installed', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '3 days', 'Neo-angle shower. Installation complete, awaiting final payment.'),
  ('j1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 'Martinez Kids Bath', '321 Broadway, Apt 22F, Manhattan', 'Manhattan', 'estimate', NULL, NULL, 'Simple tub enclosure. Waiting for client decision.'),
  ('j1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', 'Thompson Renovation', '555 West End Ave, Unit 3A, Manhattan', 'Manhattan', 'closed', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '30 days', 'Completed successfully. Client very happy.');

-- ============================================
-- SAMPLE EXPENSES
-- ============================================

INSERT INTO expenses (job_id, date, amount, vendor, category, payment_method, note) VALUES
  -- Johnson Master Bath expenses
  ('j1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '10 days', 1850.00, 'Mr Glass', 'mr_glass', 'check', 'Glass panels for shower enclosure'),
  ('j1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '8 days', 425.00, 'C.R. Laurence', 'crl', 'stripe', 'Hardware kit - hinges, handles, clips'),
  ('j1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '5 days', 45.00, 'E-ZPass', 'tolls', 'other', 'Tolls to pickup glass'),
  
  -- Chen Penthouse expenses
  ('j1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '3 days', 89.00, 'U-Haul', 'uhaul', 'stripe', 'Van rental for measurement tools'),
  ('j1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '3 days', 35.00, 'Manhattan Parking', 'parking', 'cash', 'Garage parking during site visit'),
  
  -- Rivera Condo expenses
  ('j1000000-0000-0000-0000-000000000004', CURRENT_DATE - INTERVAL '15 days', 1420.00, 'Mr Glass', 'mr_glass', 'check', 'Neo-angle glass panels'),
  ('j1000000-0000-0000-0000-000000000004', CURRENT_DATE - INTERVAL '12 days', 380.00, 'C.R. Laurence', 'crl', 'stripe', 'Neo-angle hardware set'),
  ('j1000000-0000-0000-0000-000000000004', CURRENT_DATE - INTERVAL '3 days', 129.00, 'U-Haul', 'uhaul', 'stripe', 'Van rental for installation'),
  ('j1000000-0000-0000-0000-000000000004', CURRENT_DATE - INTERVAL '3 days', 28.00, 'Subway Deli', 'meals', 'cash', 'Lunch during installation'),
  
  -- Thompson Renovation (closed job)
  ('j1000000-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '45 days', 2100.00, 'Mr Glass', 'mr_glass', 'check', 'Full enclosure glass'),
  ('j1000000-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '40 days', 520.00, 'C.R. Laurence', 'crl', 'stripe', 'Premium hardware package'),
  ('j1000000-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '32 days', 500.00, 'ABC Design Firm', 'referral_payout', 'zelle', '10% referral fee'),
  
  -- General expenses (not tied to a job)
  (NULL, CURRENT_DATE - INTERVAL '20 days', 189.00, 'Home Depot', 'home_depot', 'stripe', 'Silicone, shims, and general supplies'),
  (NULL, CURRENT_DATE - INTERVAL '7 days', 75.00, 'Home Depot', 'tools', 'stripe', 'Replacement drill bits');

-- ============================================
-- SAMPLE INVOICES
-- ============================================

-- Update sequence first
UPDATE invoice_sequence SET last_number = 1003;

INSERT INTO invoices (id, job_id, invoice_number, invoice_date, due_date, customer_name, customer_address, notes, line_items_json, subtotal, discount_applied, discount_percent, discount_amount, tax_applied, tax_rate, tax, total, status) VALUES
  -- Johnson Master Bath invoice
  ('i1000000-0000-0000-0000-000000000001', 'j1000000-0000-0000-0000-000000000001', 1001, CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE + INTERVAL '16 days', 'ABC Design Firm', '456 Park Ave, Suite 200, New York, NY 10022', '50% deposit due. Balance due upon completion of work.', 
   '[{"description": "Frameless shower enclosure - 3/8\" clear tempered glass", "qty": 1, "unit_price": 3200, "line_total": 3200}, {"description": "Premium hardware package (hinges, handle, clips)", "qty": 1, "unit_price": 650, "line_total": 650}, {"description": "Professional installation", "qty": 1, "unit_price": 800, "line_total": 800}]',
   4650.00, false, 10, 0, false, 8.875, 0, 4650.00, 'deposit_paid'),
   
  -- Rivera Condo invoice
  ('i1000000-0000-0000-0000-000000000002', 'j1000000-0000-0000-0000-000000000004', 1002, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '10 days' + INTERVAL '30 days', 'Jersey Shore Contractors', '567 Ocean Blvd, Jersey City, NJ 07302', 'Neo-angle shower enclosure installation.',
   '[{"description": "Neo-angle shower enclosure - 3/8\" clear tempered glass", "qty": 1, "unit_price": 2800, "line_total": 2800}, {"description": "Neo-angle hardware kit", "qty": 1, "unit_price": 550, "line_total": 550}, {"description": "Installation labor", "qty": 1, "unit_price": 700, "line_total": 700}]',
   4050.00, false, 10, 0, false, 6.625, 0, 4050.00, 'deposit_paid'),
   
  -- Thompson completed invoice
  ('i1000000-0000-0000-0000-000000000003', 'j1000000-0000-0000-0000-000000000006', 1003, CURRENT_DATE - INTERVAL '35 days', CURRENT_DATE - INTERVAL '5 days', 'Luxury Renovations LLC', '789 Madison Ave, New York, NY 10065', 'Full shower enclosure with premium finishes. Thank you for your business!',
   '[{"description": "Custom frameless shower enclosure", "qty": 1, "unit_price": 4200, "line_total": 4200}, {"description": "Brushed gold hardware upgrade", "qty": 1, "unit_price": 850, "line_total": 850}, {"description": "Premium installation with waterproofing", "qty": 1, "unit_price": 950, "line_total": 950}]',
   6000.00, true, 10, 600.00, false, 8.875, 0, 5400.00, 'paid');

-- ============================================
-- SAMPLE PAYMENTS
-- ============================================

INSERT INTO payments (job_id, invoice_id, date, amount, payment_type, method, note) VALUES
  -- Johnson Master Bath - deposit paid
  ('j1000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '12 days', 2325.00, 'deposit', 'stripe', '50% deposit received'),
  
  -- Rivera Condo - deposit paid, awaiting final
  ('j1000000-0000-0000-0000-000000000004', 'i1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '18 days', 2025.00, 'deposit', 'zelle', '50% deposit'),
  
  -- Thompson - fully paid
  ('j1000000-0000-0000-0000-000000000006', 'i1000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '33 days', 2700.00, 'deposit', 'stripe', '50% deposit'),
  ('j1000000-0000-0000-0000-000000000006', 'i1000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '28 days', 2700.00, 'final', 'check', 'Final payment - job complete');

-- ============================================
-- SAMPLE REMINDERS
-- ============================================

INSERT INTO reminders (job_id, title, reminder_date, priority, done) VALUES
  ('j1000000-0000-0000-0000-000000000001', 'Confirm delivery time with Mr Glass', CURRENT_DATE + INTERVAL '1 day', 'moderate', false),
  ('j1000000-0000-0000-0000-000000000001', 'Call client to confirm install date', CURRENT_DATE, 'high', false),
  ('j1000000-0000-0000-0000-000000000004', 'Collect final payment from Rivera', CURRENT_DATE - INTERVAL '1 day', 'high', false),
  ('j1000000-0000-0000-0000-000000000002', 'Order glass from Mr Glass', CURRENT_DATE + INTERVAL '3 days', 'moderate', false),
  ('j1000000-0000-0000-0000-000000000003', 'Schedule measurement visit', CURRENT_DATE + INTERVAL '2 days', 'low', false),
  ('j1000000-0000-0000-0000-000000000005', 'Follow up on Martinez estimate', CURRENT_DATE + INTERVAL '5 days', 'low', false);
