import { StreamApiNotSupportedError } from './errors.js'
import { imageDataFromVideo } from './image-data.js'
import { hasFired } from './promisify.js'

class Camera {

  constructor (videoEl, stream) {
    this.videoEl = videoEl
    this.stream = stream
  }

  stop () {
    this.stream.getTracks().forEach(
      track => track.stop()
    )
  }

  getTracks () {
    return this.stream.getTracks()
  }

  getVideoTracks () {
    return this.stream.getVideoTracks()
  }

  getCapabilities () {
    return this.getTracks().forEach(
      track => track.getCapabilities()
    )
  }

  torch (flag = true) {
    this.stream.getVideoTracks().forEach(
      track => {
        const capabilities = track.getCapabilities()
        if (capabilities.torch) {
          track.applyConstraints({advanced: [{torch: flag}]}).then(function () {
            console.log('CameraSetTorch', track.getConstraints())
          })
        }
      }
    )
  }

  zoom (zoom = 100) {
    this.stream.getVideoTracks().forEach(
      track => {
        const capabilities = track.getCapabilities()
        if (capabilities.zoom) {
          track.applyConstraints({advanced: [{zoom: zoom}]}).then(function () {
            console.log('CameraSetZoom', track.getConstraints())
          })
        }
      }
    )
  }

  captureFrame () {
    return imageDataFromVideo(this.videoEl)
  }

}

export default async function (constraints, videoEl) {
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
    throw new StreamApiNotSupportedError()
  }

  const stream = await navigator.mediaDevices.getUserMedia(constraints)
  const streamLoaded = hasFired(videoEl, 'loadeddata', 'error')

  if (videoEl.srcObject !== undefined) {
    videoEl.srcObject = stream
  } else if (videoEl.mozSrcObject !== undefined) {
    videoEl.mozSrcObject = stream
  } else if (window.URL.createObjectURL) {
    videoEl.src = window.URL.createObjectURL(stream)
  } else if (window.webkitURL) {
    videoEl.src = window.webkitURL.createObjectURL(stream)
  } else {
    videoEl.src = stream
  }

  await streamLoaded

  return new Camera(videoEl, stream)
}
