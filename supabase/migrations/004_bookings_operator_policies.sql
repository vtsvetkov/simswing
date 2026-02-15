-- Allow venue owners to INSERT bookings for their bays
CREATE POLICY "Venue owners can insert bookings for own bays"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bay_id IN (
      SELECT b.id FROM bays b
      JOIN venues v ON b.venue_id = v.id
      WHERE v.owner_id = auth.uid()
    )
  );

-- Allow venue owners to UPDATE bookings for their bays (status changes, cancellations)
CREATE POLICY "Venue owners can update bookings for own bays"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    bay_id IN (
      SELECT b.id FROM bays b
      JOIN venues v ON b.venue_id = v.id
      WHERE v.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    bay_id IN (
      SELECT b.id FROM bays b
      JOIN venues v ON b.venue_id = v.id
      WHERE v.owner_id = auth.uid()
    )
  );
