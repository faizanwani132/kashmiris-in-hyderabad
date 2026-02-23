import L from 'leaflet'

const markerInner = `
  <span class="kashmiri-pin__leaf"></span>
  <span class="kashmiri-pin__dot"></span>
`

export const communityMarkerIcon = L.divIcon({
  className: 'kashmiri-pin-wrapper',
  html: `<div class="kashmiri-pin">${markerInner}</div>`,
  iconSize: [40, 50],
  iconAnchor: [20, 46],
  popupAnchor: [0, -36],
})

export const pickerMarkerIcon = L.divIcon({
  className: 'kashmiri-picker-pin-wrapper',
  html: `<div class="kashmiri-picker-pin">${markerInner}</div>`,
  iconSize: [56, 70],
  iconAnchor: [28, 64],
})

export const createClusterIcon = (cluster) => {
  const count = cluster.getChildCount()

  return L.divIcon({
    className: 'kashmiri-cluster-wrapper',
    html: `<div class="kashmiri-cluster"><span>${count}</span></div>`,
    iconSize: [46, 46],
  })
}
