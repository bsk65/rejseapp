import { describe, expect, it } from 'vitest'
import { parseStayConfirmation } from './parseStayConfirmation'

const REF = '2026-09-29'

describe('parseStayConfirmation', () => {
  it('reads a Danish Booking.com confirmation', () => {
    const text = `Tak! Din booking på Hotel Garibaldi er bekræftet.
Bookingnummer: 4123.456.789
PIN-kode: 1234
Adresse: 6 Boulevard Garibaldi
92130 Issy-les-Moulineaux, Frankrig
Telefon: +33 1 23 45 67 89
Indtjekning
tirsdag den 29. september 2026 (15:00 - 00:00)
Udtjekning
fredag den 2. oktober 2026 (00:00 - 11:00)`

    expect(parseStayConfirmation(text, REF)).toEqual({
      name: 'Hotel Garibaldi',
      address: '6 Boulevard Garibaldi, 92130 Issy-les-Moulineaux, Frankrig',
      checkInDate: '2026-09-29',
      checkInTime: '15:00',
      checkOutDate: '2026-10-02',
      checkOutTime: '11:00',
      bookingRef: '4123.456.789',
      hostPhone: '+33 1 23 45 67 89',
    })
  })

  it('reads an English Booking.com confirmation', () => {
    const text = `Your booking at Hotel Garibaldi is confirmed.
Confirmation number: 4123456789
Check-in: Tuesday, September 29, 2026 (from 3:00 PM)
Check-out: Friday, October 2, 2026 (until 11:00 AM)
Address: 6 Boulevard Garibaldi, 92130 Issy-les-Moulineaux, France`

    expect(parseStayConfirmation(text, REF)).toMatchObject({
      name: 'Hotel Garibaldi',
      address: '6 Boulevard Garibaldi, 92130 Issy-les-Moulineaux, France',
      checkInDate: '2026-09-29',
      checkInTime: '15:00',
      checkOutDate: '2026-10-02',
      checkOutTime: '11:00',
      bookingRef: '4123456789',
    })
  })

  it('reads a Danish Airbnb confirmation with values on separate lines and no year', () => {
    const text = `Din reservation er bekræftet
Du skal til Paris!
Indtjekning
tir. 29. sep.
15:00
Udtjekning
fre. 2. okt.
11:00
Adresse
12 Rue de Rivoli
75004 Paris, Frankrig
Bekræftelseskode
HMABC12345
Wi-fi: Rivoli-Guest / kode 8877`

    expect(parseStayConfirmation(text, REF)).toEqual({
      address: '12 Rue de Rivoli, 75004 Paris, Frankrig',
      checkInDate: '2026-09-29',
      checkInTime: '15:00',
      checkOutDate: '2026-10-02',
      checkOutTime: '11:00',
      bookingRef: 'HMABC12345',
      wifi: 'Rivoli-Guest / kode 8877',
    })
  })

  it('reads an English Airbnb confirmation', () => {
    const text = `Your reservation is confirmed
Check-in
Tue, Sep 29
3:00 PM
Checkout
Fri, Oct 2
11:00 AM
Confirmation code
HMXYZ98765
Door code: 4455`

    expect(parseStayConfirmation(text, REF)).toMatchObject({
      checkInDate: '2026-09-29',
      checkInTime: '15:00',
      checkOutDate: '2026-10-02',
      checkOutTime: '11:00',
      bookingRef: 'HMXYZ98765',
      accessCode: '4455',
    })
  })

  it('reads a plain hotel mail with numeric dates', () => {
    const text = `Hotel: Albergo del Corso
Ankomst: 29.09.2026 kl. 14
Afrejse: 02.10.2026 kl. 10
Reservationsnummer: RC-5521`

    expect(parseStayConfirmation(text, REF)).toEqual({
      name: 'Albergo del Corso',
      checkInDate: '2026-09-29',
      checkInTime: '14:00',
      checkOutDate: '2026-10-02',
      checkOutTime: '10:00',
      bookingRef: 'RC-5521',
    })
  })

  it('returns nothing for unrelated text', () => {
    expect(parseStayConfirmation('Hej, vi ses i morgen!', REF)).toEqual({})
  })
})
