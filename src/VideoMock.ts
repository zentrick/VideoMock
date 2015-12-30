/// <reference path="dom/VideoElement.ts" />
/// <reference path="ui/VideoMockUI.ts" />
/// <reference path="model/ISourceData.ts" />
/// <reference path="VideoMockURL.ts" />
/// <reference path="event/MediaEvent.ts" />

namespace videomock {
  /**
   * Mocked HTMLVideoElement
   *
   * a working implementation of the HTMLVideoElement, to test Video tag without video codec
   *
   * @see HTMLVideoMock for implementation
   *
   * keep NON HTMLVideoElement attributes/methods start with _, even if they are public scope to prevent extends conflict
   */
  export class VideoMock extends dom.VideoElement {

    protected _playbackTimerId: number;
    protected _hasStarted: boolean;
    protected _hasLoadStarted: boolean;
    protected _bytesLoaded: number;
    protected _bytesTotal: number;

    protected _sourceData: model.ISourceData = videomock.VideoMockURL.DEFAULT;

    static implement(classObject: Function): void {
      // super call
      dom.VideoElement.implement(classObject)

      // overriden prototype methods
      var methods = [
        'play',
        'pause',
        'load',
        '_startPlaybackTimer',
        '_stopPlaybackTimer',
        '_replay',
        '_handleEvent',
        '_updateDimensions',
        '_setMetadataLoaded',
        '_set_src',
        '_set_width',
        '_set_height',
        '_set_autoplay',
        '_set_preload',
        '_set_volume',
      ]

      methods.forEach((item): void => {
        classObject.prototype[item] = VideoMock.prototype[item]
      })
    }

    public play(): void {
      // trigger load + autoplay
      if (!this._hasLoadStarted) {
        return this.load(true)
      }

      if (!this._hasStarted) {
        this._hasStarted = true
        this._dispatchEvent(event.MediaEvent.play)
        this._dispatchEvent(event.MediaEvent.playing)

        // And now simulate playback !
        this._startPlaybackTimer()
      } else if (this._paused) {
        this._paused = false
        this._dispatchEvent(event.MediaEvent.play)
        this._dispatchEvent(event.MediaEvent.playing)
      }
    }

    public pause(): void {
      if (!this._paused) {
        this._paused = true
        this._dispatchEvent(event.MediaEvent.pause)
      }
    }

    public load(autoplay?: boolean): void {
      if (this._hasLoadStarted || !this._src) {
        return
      }

      this._hasLoadStarted = true

      this._currentSrc = this._src

      // as we don't handle video load, we can dispatch events right now !
      this._dispatchEvent(event.MediaEvent.loadstart)

      // When set src, video will always load 1Mo per second !
      var intervalId: number
      var virtualSize: number = 3000 // size of the mediafile in Ko
      var prevLoaded = 0
      var step = 100
      var ko: number = 1024 // One Ko
      var enoughData: number = 200 // enough data in ko to start video playback
      var pos: number = 0

      this._bytesTotal = virtualSize * ko

      intervalId = setInterval((): void => {
        if (this._bytesLoaded < this._bytesTotal) {
          prevLoaded = this._bytesLoaded
          this._bytesLoaded += step * ko
        }

        if (this._bytesLoaded >= this._bytesTotal) {
          this._bytesLoaded = this._bytesTotal
        }

        if (this._bytesLoaded === this._bytesTotal) {
          clearInterval(intervalId)
        }

        // add a buffered timeRange
        this._buffered.addRange(prevLoaded, this._bytesLoaded)

        // simulate the load progress with readyState and events
        if (pos === 0) {
          this._setMetadataLoaded()
        } else if (pos === 1 && this._readyState < dom.MediaElement.HAVE_CURRENT_DATA) {
          this._readyState = dom.MediaElement.HAVE_CURRENT_DATA
        } else if (pos === 2 && this._readyState < dom.MediaElement.HAVE_FUTURE_DATA) {
          this._readyState = dom.MediaElement.HAVE_FUTURE_DATA
        }

        if (this._readyState === dom.MediaElement.HAVE_FUTURE_DATA && this._bytesLoaded > enoughData) {
          this._readyState = dom.MediaElement.HAVE_ENOUGH_DATA

          if (this._autoplay || autoplay) {
            this.play()
          }
        }

        this._handleEvent(new ProgressEvent(event.MediaEvent.progress, {
          'lengthComputable': true,
          'loaded': this._bytesLoaded,
          'total': virtualSize * 1000
        }))

        pos++
      }, step)
    }

    /**
     * This setters will be called when access to .width attribute
     */
    public _set_width(value: number): void {
      this._width = value
      this._updateDimensions()
    }
    public _set_height(value: number): void {
      this._height = value
      this._updateDimensions()
    }

    /**
     * Override Handle event !
     * @param {Event} evt [description]
     */
    public _handleEvent(evt: Event): void {
      super._handleEvent(evt)

      // Event here will be executed after user callback !
      switch (evt.type) {
        case event.MediaEvent.ended:
          this._stopPlaybackTimer()
          if (this._loop) {
            this._replay()
          }
          break
      }
    }

    public _updateDimensions(): void {
      // calculate base video size !
      var videoRatio: number = this._sourceData.width / this._sourceData.height
      var requestRatio: number = this._width / this._height

      // pillarbox video
      if (requestRatio > videoRatio) {
        this._videoHeight = this._height
        this._videoWidth = this._height * videoRatio
      } else { // letterbox video
        this._videoWidth = this._width
        this._videoHeight = this._width / videoRatio
      }
    }

    /**
     * Override src setter
     */
    public _set_src(value: string): void {
      if (this._src === value || this._currentSrc === value) {
        return
      }

      this._src = value
      this._hasStarted = false
      this._hasLoadStarted = false

      this._sourceData = VideoMockURL.parse(value)

      if (this._preload || this._autoplay) {
        this.load()
      }
    }

    public _set_volume(value: number): void {
      this._volume = value
      this._dispatchEvent(event.MediaEvent.volumechange)
    }

    public _set_autoplay(value: boolean): void {
      this._autoplay = value
      this.play()
    }

    public _set_preload(value: string): void {
      this._preload = value

      switch(value) {
        case 'metadata':
          this._setMetadataLoaded()
          break
         case 'auto':
         case '':
           this.load()
           break
      }
    }

    protected _setMetadataLoaded(): void {
      if (this._readyState < dom.MediaElement.HAVE_METADATA) {
        this._dispatchEvent(event.MediaEvent.loadeddata)

        // set metadata before dispatch loadedmetadata event
        this._duration = this._sourceData.duration

        this._dispatchEvent(event.MediaEvent.loadedmetadata)
        this._dispatchEvent(event.MediaEvent.durationchange)
        this._dispatchEvent(event.MediaEvent.canplay)
        this._dispatchEvent(event.MediaEvent.canplaythrough)

        this._readyState = dom.MediaElement.HAVE_METADATA
      }
    }

    protected _startPlaybackTimer(): void {
      if (!this._playbackTimerId) {
        var step: number = 100
        this._playbackTimerId = setInterval((): void => {

          if (!this._paused) {
            // currentTime is in seconds !
            // and must use set_currentTime insteads of propertie due to property inheritance problem in ES5
            this._currentTime =  this._currentTime + (step / 1000)

            if (this._currentTime >= this._duration) {
              this._currentTime = this._duration
              this._dispatchEvent(event.MediaEvent.ended)
              this._stopPlaybackTimer()
            } else {
              this._dispatchEvent(event.MediaEvent.timeupdate)
            }
          }
        }, step)
      }
    }

    protected _stopPlaybackTimer(): void {
      if (this._playbackTimerId) {
        clearInterval(this._playbackTimerId)
      }
    }

    protected _replay(): void {
      this._stopPlaybackTimer()
      this._currentTime = 0
      this._readyState = dom.MediaElement.HAVE_FUTURE_DATA
      this._hasStarted = false
      this._hasLoadStarted = false
      this.play()
    }
  }
}
