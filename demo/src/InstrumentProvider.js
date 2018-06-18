import React from 'react';
import Soundfont from 'soundfont-player';

class InstrumentProvider extends React.Component {
  static defaultProps = {
    format: 'mp3',
    soundfont: 'MusyngKite',
    instrumentName: 'acoustic_grand_piano',
  };

  constructor(props) {
    super(props);
    this.state = {
      activeAudioNodes: {},
      instrument: null,
      instrumentName: props.instrumentName,
      instrumentList: [props.instrumentName],
    };
  }

  componentDidMount() {
    this.loadInstrument(this.props.instrumentName);
    this.loadInstrumentList();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.instrumentName !== this.state.instrumentName) {
      this.loadInstrument(this.state.instrumentName);
    }
  }

  // TODO: change this to load instrumentURL instead
  loadInstrument = (instrumentName) => {
    Soundfont.instrument(this.props.audioContext, instrumentName, {
      format: this.props.format,
      soundfont: this.props.soundfont,
      nameToUrl: (name, soundfont, format) => {
        return `${this.props.hostname}/${soundfont}/${name}-${format}.js`;
      },
    }).then((instrument) => {
      this.setState({
        instrument,
      });
    });
  };

  loadInstrumentList = () => {
    fetch('http://d1pzp51pvbm36p.cloudfront.net/MusyngKite/names.json')
      .then((response) => response.json())
      .then((data) => {
        this.setState({
          instrumentList: data,
        });
      });
  };

  onNoteStart = (midiNumber) => {
    this.props.audioContext.resume().then(() => {
      const audioNode = this.state.instrument.play(midiNumber);
      this.setState({
        activeAudioNodes: Object.assign({}, this.state.activeAudioNodes, {
          [midiNumber]: audioNode,
        }),
      });
    });
  };

  onNoteStop = (midiNumber) => {
    this.props.audioContext.resume().then(() => {
      if (!this.state.activeAudioNodes[midiNumber]) {
        return;
      }
      const audioNode = this.state.activeAudioNodes[midiNumber];
      audioNode.stop();
      this.setState({
        activeAudioNodes: Object.assign({}, this.state.activeAudioNodes, { [midiNumber]: null }),
      });
    });
  };

  // Clear any residual notes that don't get called with onNoteStop
  onStopAll = () => {
    this.props.audioContext.resume().then(() => {
      const activeAudioNodes = Object.values(this.state.activeAudioNodes);
      activeAudioNodes.forEach((node) => {
        if (node) {
          node.stop();
        }
      });
      this.setState({
        activeAudioNodes: {},
      });
    });
  };

  onChangeInstrument = (instrumentName) => {
    this.setState({
      instrument: null, // Re-trigger loading state
      instrumentName,
    });
  };

  render() {
    return this.props.children({
      isLoading: !(this.state.instrument && this.state.instrumentList),
      onNoteStart: this.onNoteStart,
      onNoteStop: this.onNoteStop,
      onStopAll: this.onStopAll,
      onChangeInstrument: this.onChangeInstrument,
      instrumentName: this.state.instrumentName,
      instrumentList: this.state.instrumentList,
    });
  }
}

export default InstrumentProvider;