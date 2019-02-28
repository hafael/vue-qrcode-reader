import { StreamApiNotSupportedError } from './errors.js'
import { imageDataFromVideo } from './image-data.js'
import { hasFired } from './promisify.js'
import { isNull } from 'util'

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

  getCapabilities () {
    return this.getTracks().forEach(
      track => track.getCapabilities()
    )
  }

  torch (flag = true) {
    this.getTracks().forEach(
      track => track.applyConstraints({advanced: [{torch: flag}]})
    )
  }

  zoom (zoom) {
    const capabilities = this.getCapabilities()
    if (isNull(zoom) && capabilities.zoom) {
      this.stream.getTracks().forEach(
        track => track.applyConstraints({zoom: capabilities.zoom.max})
                      .catch(e => console.log(e))
      )
    } else {
      this.stream.getTracks().forEach(
        track => track.applyConstraints({zoom: zoom})
                      .catch(e => console.log(e))
      )
    }
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
