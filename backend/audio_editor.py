import os
import subprocess
from pydub import AudioSegment
from pydub.utils import mediainfo
from pydub.silence import detect_nonsilent


class AudioEditor:
    """
    Handles audio file manipulation including trimming and format conversion.
    """
    
    def __init__(self, temp_dir='../temp', output_dir='../outputs'):
        """
        Initialize the audio editor.
        
        Args:
            temp_dir (str): Directory for temporary files
            output_dir (str): Directory for output files
        """
        self.temp_dir = temp_dir
        self.output_dir = output_dir
        
        os.makedirs(self.temp_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
    
    def get_audio_info(self, audio_path):
        """
        Get metadata information about an audio file.
        
        Args:
            audio_path (str): Path to the audio file
            
        Returns:
            dict: Audio metadata including duration, format, bitrate, etc.
        """
        try:
            info = mediainfo(audio_path)
            audio = AudioSegment.from_file(audio_path)
            
            return {
                'duration': len(audio) / 1000.0,  # Duration in seconds
                'duration_ms': len(audio),
                'channels': audio.channels,
                'sample_rate': audio.frame_rate,
                'sample_width': audio.sample_width,
                'format': info.get('format_name', 'unknown'),
                'bitrate': info.get('bit_rate', 'unknown'),
                'codec': info.get('codec_name', 'unknown')
            }
        except Exception as e:
            raise Exception(f"Error getting audio info: {str(e)}")
    
    def trim_audio(self, audio_path, start_time, end_time, output_filename):
        """
        Trim an audio file from start_time to end_time.
        
        Args:
            audio_path (str): Path to the input audio file
            start_time (float): Start time in seconds
            end_time (float): End time in seconds
            output_filename (str): Name of the output file
            
        Returns:
            str: Path to the trimmed audio file
        """
        print(f"Trimming audio from {start_time}s to {end_time}s")
        
        try:
            # Load audio file
            audio = AudioSegment.from_file(audio_path)
            
            # Convert times to milliseconds
            start_ms = int(start_time * 1000)
            end_ms = int(end_time * 1000)
            
            # Validate times
            if start_ms < 0:
                raise ValueError("Start time cannot be negative")
            if end_ms > len(audio):
                raise ValueError(f"End time exceeds audio duration ({len(audio)/1000}s)")
            if start_ms >= end_ms:
                raise ValueError("Start time must be before end time")
            
            # Extract segment
            trimmed_audio = audio[start_ms:end_ms]
            
            # Save trimmed audio
            output_path = os.path.join(self.output_dir, output_filename)
            
            # Export based on file extension
            file_extension = output_filename.split('.')[-1].lower()
            
            if file_extension == 'mp3':
                trimmed_audio.export(output_path, format='mp3', bitrate='192k')
            elif file_extension == 'wav':
                trimmed_audio.export(output_path, format='wav')
            elif file_extension == 'ogg':
                trimmed_audio.export(output_path, format='ogg')
            elif file_extension == 'm4a':
                trimmed_audio.export(output_path, format='ipod')
            else:
                # Default to mp3
                output_path = output_path.rsplit('.', 1)[0] + '.mp3'
                trimmed_audio.export(output_path, format='mp3', bitrate='192k')
            
            print(f"Audio trimmed successfully: {output_path}")
            return output_path
            
        except Exception as e:
            raise Exception(f"Error trimming audio: {str(e)}")
    
    def convert_audio_format(self, audio_path, output_format='mp3', output_filename=None):
        """
        Convert audio to a different format.
        
        Args:
            audio_path (str): Path to the input audio file
            output_format (str): Desired output format (mp3, wav, ogg, etc.)
            output_filename (str): Optional custom output filename
            
        Returns:
            str: Path to the converted audio file
        """
        print(f"Converting audio to {output_format}")
        
        try:
            audio = AudioSegment.from_file(audio_path)
            
            if output_filename is None:
                base_name = os.path.splitext(os.path.basename(audio_path))[0]
                output_filename = f"{base_name}_converted.{output_format}"
            
            output_path = os.path.join(self.output_dir, output_filename)
            
            if output_format == 'mp3':
                audio.export(output_path, format='mp3', bitrate='192k')
            elif output_format == 'wav':
                audio.export(output_path, format='wav')
            elif output_format == 'ogg':
                audio.export(output_path, format='ogg')
            elif output_format == 'm4a':
                audio.export(output_path, format='ipod')
            else:
                audio.export(output_path, format=output_format)
            
            print(f"Audio converted successfully: {output_path}")
            return output_path
            
        except Exception as e:
            raise Exception(f"Error converting audio: {str(e)}")
    
    def merge_audio_segments(self, audio_paths, output_filename):
        """
        Merge multiple audio files into one.
        
        Args:
            audio_paths (list): List of paths to audio files to merge
            output_filename (str): Name of the output file
            
        Returns:
            str: Path to the merged audio file
        """
        print(f"Merging {len(audio_paths)} audio files")
        
        try:
            # Load first audio file
            merged_audio = AudioSegment.from_file(audio_paths[0])
            
            # Append remaining files
            for audio_path in audio_paths[1:]:
                audio = AudioSegment.from_file(audio_path)
                merged_audio += audio
            
            # Save merged audio
            output_path = os.path.join(self.output_dir, output_filename)
            file_extension = output_filename.split('.')[-1].lower()
            
            if file_extension == 'mp3':
                merged_audio.export(output_path, format='mp3', bitrate='192k')
            else:
                merged_audio.export(output_path, format=file_extension)
            
            print(f"Audio files merged successfully: {output_path}")
            return output_path
            
        except Exception as e:
            raise Exception(f"Error merging audio files: {str(e)}")
    
    def apply_fade(self, audio_path, fade_in_duration=1000, fade_out_duration=1000, output_filename=None):
        """
        Apply fade in/out effects to audio.
        
        Args:
            audio_path (str): Path to the input audio file
            fade_in_duration (int): Fade in duration in milliseconds
            fade_out_duration (int): Fade out duration in milliseconds
            output_filename (str): Optional custom output filename
            
        Returns:
            str: Path to the processed audio file
        """
        print(f"Applying fade effects: fade_in={fade_in_duration}ms, fade_out={fade_out_duration}ms")
        
        try:
            audio = AudioSegment.from_file(audio_path)
            
            # Apply fade effects
            if fade_in_duration > 0:
                audio = audio.fade_in(fade_in_duration)
            if fade_out_duration > 0:
                audio = audio.fade_out(fade_out_duration)
            
            if output_filename is None:
                base_name = os.path.splitext(os.path.basename(audio_path))[0]
                output_filename = f"{base_name}_faded.mp3"
            
            output_path = os.path.join(self.output_dir, output_filename)
            audio.export(output_path, format='mp3', bitrate='192k')
            
            print(f"Fade effects applied successfully: {output_path}")
            return output_path
            
        except Exception as e:
            raise Exception(f"Error applying fade effects: {str(e)}")
    
    def get_waveform_data(self, audio_path, sample_rate=100):
        """
        Generate waveform data for visualization.
        
        Args:
            audio_path (str): Path to the audio file
            sample_rate (int): Number of samples per second for the waveform
            
        Returns:
            dict: Waveform data with samples and metadata
        """
        try:
            audio = AudioSegment.from_file(audio_path)
            
            # Get raw audio data
            samples = audio.get_array_of_samples()
            
            # Calculate downsampling ratio
            original_sample_rate = audio.frame_rate
            downsample_ratio = original_sample_rate // sample_rate
            
            # Downsample the data
            downsampled = samples[::downsample_ratio]
            
            # Normalize to -1 to 1 range
            max_value = max(abs(min(downsampled)), abs(max(downsampled)))
            if max_value > 0:
                normalized = [float(s) / max_value for s in downsampled]
            else:
                normalized = [0.0] * len(downsampled)
            
            return {
                'samples': normalized[:10000],  # Limit to 10000 points for performance
                'duration': len(audio) / 1000.0,
                'sample_rate': sample_rate,
                'channels': audio.channels
            }
            
        except Exception as e:
            raise Exception(f"Error generating waveform data: {str(e)}")

    def detect_voice_segments(
        self,
        audio_path,
        min_silence_len=700,
        silence_thresh=-40,
        padding=200,
        max_segments=None,
    ):
        """Detect non-silent segments (approximate timestamps) within an audio file."""

        try:
            audio = AudioSegment.from_file(audio_path)
            segments = detect_nonsilent(
                audio,
                min_silence_len=int(min_silence_len),
                silence_thresh=int(silence_thresh),
            )

            results = []
            total_duration = len(audio)

            for start_ms, end_ms in segments:
                adjusted_start = max(0, start_ms - int(padding))
                adjusted_end = min(total_duration, end_ms + int(padding))
                results.append(
                    {
                        "start_time": adjusted_start / 1000.0,
                        "end_time": adjusted_end / 1000.0,
                        "duration": (adjusted_end - adjusted_start) / 1000.0,
                    }
                )

                if max_segments and len(results) >= max_segments:
                    break

            return {
                "segments": results,
                "total_segments": len(results),
                "audio_duration": total_duration / 1000.0,
                "min_silence_len": min_silence_len,
                "silence_thresh": silence_thresh,
                "padding": padding,
            }

        except Exception as exc:  # noqa: BLE001
            raise Exception(f"Error detecting timestamps: {exc}")

    def clean_audio(self, audio_path, output_filename=None, 
                   noise_reduction=True, equalize=True, normalize=True,
                   noise_reduction_level=0.5, highpass_freq=80, lowpass_freq=8000):
        """
        Clean audio quality using FFmpeg filters for mosque recordings.
        
        Args:
            audio_path (str): Path to the input audio file
            output_filename (str): Optional custom output filename
            noise_reduction (bool): Apply noise reduction filter
            equalize (bool): Apply equalization to enhance voice clarity
            normalize (bool): Normalize audio levels
            noise_reduction_level (float): Noise reduction amount 0.0-1.0 (default 0.5)
            highpass_freq (int): High-pass filter frequency to remove rumble (default 80Hz)
            lowpass_freq (int): Low-pass filter frequency to remove hiss (default 8000Hz)
            
        Returns:
            str: Path to the cleaned audio file
        """
        print(f"Cleaning audio quality for: {audio_path}")
        
        try:
            if output_filename is None:
                base_name = os.path.splitext(os.path.basename(audio_path))[0]
                output_filename = f"{base_name}_cleaned.mp3"
            
            output_path = os.path.join(self.output_dir, output_filename)
            
            # Build FFmpeg filter chain
            filters = []
            
            # High-pass filter to remove low-frequency rumble (air conditioning, etc.)
            if highpass_freq > 0:
                filters.append(f"highpass=f={highpass_freq}")
            
            # Low-pass filter to remove high-frequency hiss
            if lowpass_freq > 0 and lowpass_freq < 20000:
                filters.append(f"lowpass=f={lowpass_freq}")
            
            # Noise reduction using FFmpeg's afftdn filter
            if noise_reduction:
                # Convert normalized level (0.0-1.0) to decibels (-20 to -80)
                # 0.0 = -20dB (light reduction), 1.0 = -80dB (heavy reduction)
                nf_db = -20 - (noise_reduction_level * 60)  # Maps 0.0->-20, 1.0->-80
                filters.append(f"afftdn=nf={nf_db}:nt=w")
            
            # Equalization to enhance voice frequencies (300Hz-3400Hz for speech)
            if equalize:
                # Boost mid-range frequencies where voice sits
                filters.append("equalizer=f=1000:width_type=h:width=100:g=3")
                filters.append("equalizer=f=2000:width_type=h:width=200:g=2")
            
            # Simple volume normalization (safer alternative to compand)
            if normalize:
                filters.append("volume=0.8")
            
            # Join all filters
            filter_chain = ",".join(filters) if filters else None
            
            print(f"Applying filters: {filter_chain}")
            
            # Build FFmpeg command
            ffmpeg_cmd = [
                "ffmpeg",
                "-y",  # Overwrite output file
                "-i", audio_path,
            ]
            
            # Add audio filters if any
            if filter_chain:
                ffmpeg_cmd.extend(["-af", filter_chain])
            
            # Add output options
            ffmpeg_cmd.extend([
                "-c:a", "mp3",
                "-b:a", "192k",
                "-ar", "44100",  # Standard sample rate for voice
                output_path
            ])
            
            print(f"Running FFmpeg command...")
            
            # Execute FFmpeg command
            result = subprocess.run(
                ffmpeg_cmd,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace'
            )
            
            if result.returncode != 0:
                print(f"FFmpeg error: {result.stderr}")
                raise Exception(f"FFmpeg audio cleaning failed: {result.stderr}")
            
            print(f"Audio cleaned successfully: {output_path}")
            return output_path
            
        except Exception as e:
            raise Exception(f"Error cleaning audio: {str(e)}")


def test_audio_editor():
    """
    Test function to verify audio editing works.
    """
    editor = AudioEditor(temp_dir='../temp', output_dir='../outputs')
    
    # Example usage (requires actual audio file)
    # info = editor.get_audio_info('path/to/audio.mp3')
    # print(f"Audio info: {info}")
    # 
    # trimmed = editor.trim_audio('path/to/audio.mp3', 10, 30, 'trimmed_audio.mp3')
    # print(f"Trimmed audio saved to: {trimmed}")


if __name__ == '__main__':
    test_audio_editor()
