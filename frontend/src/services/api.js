import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const videoAPI = {
  /**
   * Generate a video with subtitles
   * @param {File} audioFile - Audio file
   * @param {Object} subtitlesPayload - Object with surah_reference and subtitles array
   * @param {string} outputName - Optional output filename
   */
  generateVideo: async (
    audioFile,
    subtitlesPayload,
    outputName = 'quran_video.mp4',
    options = {},
  ) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('subtitles_json', JSON.stringify(subtitlesPayload));
    formData.append('output_name', outputName);

    Object.entries(options).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      if (Array.isArray(value)) {
        value
          .filter((item) => item !== undefined && item !== null && item !== '')
          .forEach((item) => {
            formData.append(key, item);
          });
      } else {
        formData.append(key, value);
      }
    });

    const response = await api.post('/generate-video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Download a generated video
   * @param {string} filename - Video filename
   */
  downloadVideo: (filename) => {
    return `${API_BASE_URL}/video/${filename}`;
  },

  /**
   * Test Arabic text rendering
   * @param {string} arabicText - Arabic text to test
   * @param {string} spanishText - Spanish text to test
   */
  testArabicRendering: async (arabicText, spanishText) => {
    const response = await api.post('/test-arabic', {
      arabic_text: arabicText,
      spanish_text: spanishText,
    });
    return response.data;
  },
};

export const audioAPI = {
  /**
   * Get audio file information
   * @param {File} audioFile - Audio file
   */
  getAudioInfo: async (audioFile) => {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await api.post('/audio/info', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Trim an audio file
   * @param {File} audioFile - Audio file
   * @param {number} startTime - Start time in seconds
   * @param {number} endTime - End time in seconds
   * @param {string} outputName - Optional output filename
   */
  trimAudio: async (audioFile, startTime, endTime, outputName) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('start_time', startTime);
    formData.append('end_time', endTime);
    if (outputName) {
      formData.append('output_name', outputName);
    }

    const response = await api.post('/audio/trim', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Download an audio file
   * @param {string} filename - Audio filename
   */
  downloadAudio: (filename) => {
    return `${API_BASE_URL}/audio/${filename}`;
  },

  /**
   * Get waveform data for visualization
   * @param {File} audioFile - Audio file
   * @param {number} sampleRate - Sample rate for waveform
   */
  getWaveform: async (audioFile, sampleRate = 100) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('sample_rate', sampleRate);

    const response = await api.post('/audio/waveform', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Detect timestamps (non-silent segments) within an audio file.
   * @param {File} audioFile - Audio file
   * @param {Object} options - Optional detection parameters
   */
  detectTimestamps: async (audioFile, options = {}) => {
    const formData = new FormData();
    formData.append('audio', audioFile);

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });

    const response = await api.post('/audio/timestamps', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Clean audio quality using noise reduction and enhancement filters
   * @param {File} audioFile - Audio file to clean
   * @param {Object} options - Cleaning options
   */
  cleanAudio: async (audioFile, options = {}) => {
    const formData = new FormData();
    formData.append('audio', audioFile);

    // Add optional parameters with defaults
    const {
      outputName,
      noiseReduction = true,
      equalize = true,
      normalize = true,
      noiseReductionLevel = 0.5,
      highpassFreq = 80,
      lowpassFreq = 8000
    } = options;

    formData.append('noise_reduction', noiseReduction);
    formData.append('equalize', equalize);
    formData.append('normalize', normalize);
    formData.append('noise_reduction_level', noiseReductionLevel);
    formData.append('highpass_freq', highpassFreq);
    formData.append('lowpass_freq', lowpassFreq);

    if (outputName) {
      formData.append('output_name', outputName);
    }

    const response = await api.post('/audio/clean', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
