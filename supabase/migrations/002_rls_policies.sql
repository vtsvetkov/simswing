-- SimSwing: RLS policies for authenticated venue owners
-- Venue owners can manage their own venues and related data

-- venues: owners can SELECT, INSERT, UPDATE their own venues
CREATE POLICY "Venue owners can manage own venues"
  ON venues
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- bays: owners can manage bays in their venues
CREATE POLICY "Venue owners can manage own bays"
  ON bays
  FOR ALL
  TO authenticated
  USING (
    venue_id IN (
      SELECT id FROM venues WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    venue_id IN (
      SELECT id FROM venues WHERE owner_id = auth.uid()
    )
  );

-- availability_rules: same pattern as bays
CREATE POLICY "Venue owners can manage own availability_rules"
  ON availability_rules
  FOR ALL
  TO authenticated
  USING (
    venue_id IN (
      SELECT id FROM venues WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    venue_id IN (
      SELECT id FROM venues WHERE owner_id = auth.uid()
    )
  );

-- bookings: venue owners can SELECT (view) bookings for their venues
-- Bookings are linked to bays, which are linked to venues
CREATE POLICY "Venue owners can view own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    bay_id IN (
      SELECT b.id FROM bays b
      JOIN venues v ON b.venue_id = v.id
      WHERE v.owner_id = auth.uid()
    )
  );

-- customers: Add when customers table exists with customer_id on bookings.
-- Policy: SELECT for authenticated where id in (select customer_id from bookings
-- where venue via bay in owner's venues).
