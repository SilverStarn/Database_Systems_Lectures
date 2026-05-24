import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react'

export function StageControls({
  current,
  total,
  isPlaying,
  playLabel,
  onTogglePlay,
  onPrevious,
  onNext,
}: {
  current: number
  total: number
  isPlaying: boolean
  playLabel: string
  onTogglePlay?: () => void
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="stage-controls" aria-label="Playback controls">
      <div className="stage-nav-pair" aria-label="Slide navigation">
        <button className="icon-button" disabled={current <= 1} onClick={onPrevious} title="Previous" type="button">
          <ArrowLeft size={19} aria-hidden={true} />
          <span>Previous</span>
        </button>
        <button className="icon-button" disabled={current >= total} onClick={onNext} title="Next" type="button">
          <span>Next</span>
          <ArrowRight size={19} aria-hidden={true} />
        </button>
      </div>
      <span className="position-pill">{current} / {total}</span>
      {onTogglePlay && (
        <button className="play-button" onClick={onTogglePlay} title={playLabel} type="button">
          {isPlaying ? <Pause size={18} aria-hidden={true} /> : <Play size={18} aria-hidden={true} />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>
      )}
    </div>
  )
}
