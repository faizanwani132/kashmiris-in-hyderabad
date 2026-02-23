import { LOCATION_PRECISION } from '../constants'

const EARTH_RADIUS_KM = 6371

const toRadians = (degrees) => (degrees * Math.PI) / 180

export const approximateCoordinate = (value) =>
  Number.parseFloat(Number(value).toFixed(LOCATION_PRECISION))

export const approximateCoordinates = ({ lat, lng }) => ({
  lat: approximateCoordinate(lat),
  lng: approximateCoordinate(lng),
})

export const haversineDistanceKm = (pointA, pointB) => {
  const dLat = toRadians(pointB.lat - pointA.lat)
  const dLng = toRadians(pointB.lng - pointA.lng)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(pointA.lat)) *
      Math.cos(toRadians(pointB.lat)) *
      Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const getCurrentLocation = () =>
  new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not available on this device.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        resolve({ lat: coords.latitude, lng: coords.longitude })
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error('Location permission was denied.'))
          return
        }
        reject(new Error('Could not fetch your location right now.'))
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      },
    )
  })
