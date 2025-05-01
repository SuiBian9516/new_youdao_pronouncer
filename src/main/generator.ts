import Ffmpeg from 'fluent-ffmpeg';
import { Item } from './database';
import { is } from '@electron-toolkit/utils';
import Logger from './logger';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffprobePath from '@ffprobe-installer/ffprobe';
import * as fs from 'fs';
import path, { join } from 'path';
import { BrowserWindow } from 'electron';

export default class Generator {
  private background: string;
  private character: [string, string];

  private readonly AUDIO_PARAMS = {
    codec: 'aac',
    bitrate: '192k',
    sampleRate: '48000',
    channels: '1',
  };

  private readonly VIDEO_PARAMS = {
    fps: '30',
    codec: 'libx264',
    preset: 'ultrafast',
    size: '1920x1080',
  };

  constructor(background: string, character: [string, string]) {
    this.background = background;
    this.character = character;
    if (is.dev) {
      Ffmpeg.setFfmpegPath(ffmpegPath.path);
      Ffmpeg.setFfprobePath(ffprobePath.path);
    } else {
      Ffmpeg.setFfmpegPath(ffmpegPath.path.replace('app.asar', 'app.asar.unpacked'));
      Ffmpeg.setFfprobePath(ffprobePath.path.replace('app.asar', 'app.asar.unpacked'));
    }
  }

  public async generateVideos(
    title: string,
    subtitle: string,
    videoPath: string,
    data: Item[],
    dest: string
  ) {
    await this.createTextVideo(join(videoPath, 'start.mp4'), title, subtitle, 2);
    let files = [join(videoPath, 'start.mp4')];
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].count; j++) {
        const item = data[i];
        const audioPath = item.audio[0];
        const imagePath = item.image;
        const example = item.example;
        const exampleDescription = item.description[1];
        const word = item.name;
        const description = item.description[0];
        let window = BrowserWindow.getAllWindows()[0];
        window?.webContents.send('progress:generate', `正在生成视频：${word}`);
        await this.createWordVideoSegmentWithAudio(
          path.join(videoPath, `${item.id}_item_${j}.mp4`),
          word,
          description,
          audioPath,
          imagePath,
          example,
          exampleDescription,
          0
        );
        files.push(path.join(videoPath, `${item.id}_item_${j}.mp4`));
        if (example != '') {
          await this.createWordVideoSegmentWithAudio(
            path.join(videoPath, `${item.id}_example_${j}.mp4`),
            word,
            description,
            item.audio[1],
            imagePath,
            example,
            exampleDescription,
            1
          );
          files.push(path.join(videoPath, `${item.id}_example_${j}.mp4`));
        }
      }
    }

    let window = BrowserWindow.getAllWindows()[0];
    window?.webContents.send('progress:generate', `正在合并视频`);
    await this.mergeVideos(videoPath, files, dest);
  }

  private createTextVideo(
    outputPath: string,
    title: string,
    description: string,
    duration: number
  ): Promise<void> {
    const escapedTitle = title.replace(/(['])/g, '\\\\$1').replace(/\n/g, '\\n');
    const escapedDes = description.replace(/(['])/g, '\\$1').replace(/\n/g, '\\\\n');

    const titleFontColor = this.character[0];
    const descFontColor = this.character[0];

    const titleFontSize = title.length > 20 ? 80 : 120;
    const descFontSize = description.length > 30 ? 50 : 80;

    return new Promise((resolve, reject) => {
      const command = Ffmpeg()
        .input(`color=c=${this.background.replace('#', '0x')}:s=1920x1080:d=${duration}`)
        .inputFormat('lavfi')
        .input('anullsrc=channel_layout=mono:sample_rate=48000')
        .inputFormat('lavfi')
        .inputOptions(['-t', duration.toString()])
        .addOption(
          '-vf',
          `drawtext=font='Microsoft YaHei':text='${escapedTitle}':fontsize=${titleFontSize}:fontcolor=${titleFontColor}:x=(w-text_w)/2:y=(h-text_h)/2-100,` +
            `drawtext=font='Microsoft YaHei':text='${escapedDes}':fontsize=${descFontSize}:fontcolor=${descFontColor}:x=(w-text_w)/2:y=(h-text_h)/2+100`
        )
        .outputOptions([
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-profile:v',
          'high',
          '-level',
          '4.0',
          '-pix_fmt',
          'yuv420p',
          '-c:a',
          this.AUDIO_PARAMS.codec,
          '-b:a',
          this.AUDIO_PARAMS.bitrate,
          '-ar',
          this.AUDIO_PARAMS.sampleRate,
          '-ac',
          this.AUDIO_PARAMS.channels,
          '-r',
          '30',
          '-vsync',
          '1',
        ]);

      command
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', err => {
          Logger.getInstance().error(`Error in createTextVideo: ${err}`, 'generator');
          reject(err);
        })
        .run();
    });
  }

  private createWordVideoSegmentWithAudio(
    outputPath: string,
    word: string,
    description: string,
    audioPath: string,
    imagePath: string,
    example: string,
    exampleDescription: string,
    type: 0 | 1 = 0
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const audioDuration = await this.getAudioDuration(audioPath);
      const videoDuration = (audioDuration * 2).toFixed(3);

      const escapeText = (text: string) => {
        return text
          .replace(/\\/g, '\\\\')
          .replace(/:/g, '\\:')
          .replace(/[\r\n]/g, ' ')
          .replace(/'/g, '\u2019');
      };

      const wrapText = (
        text: string,
        fontSize: number,
        minFontSize: number,
        defaultMaxChars: number
      ): { lines: string[]; fontSize: number } => {
        const getMaxCharsForFontSize = (size: number): number => {
          const calculatedChars = Math.floor(800 / (size * 0.5));
          return Math.min(calculatedChars, defaultMaxChars);
        };

        let currentFontSize = fontSize;
        let maxChars = getMaxCharsForFontSize(currentFontSize);

        if (text.length <= maxChars) {
          return { lines: [text], fontSize: currentFontSize };
        }

        while (currentFontSize > minFontSize && text.length > maxChars) {
          currentFontSize = Math.max(currentFontSize * 0.9, minFontSize);
          maxChars = getMaxCharsForFontSize(currentFontSize);

          if (text.length <= maxChars && currentFontSize <= minFontSize + 5) {
            return { lines: [text], fontSize: currentFontSize };
          }
        }

        const lines: string[] = [];
        let currentLine = '';
        const words = text.split(' ');

        for (const word of words) {
          if ((currentLine + word).length <= maxChars) {
            currentLine += (currentLine ? ' ' : '') + word;
          } else {
            if (currentLine) lines.push(currentLine);

            if (word.length > maxChars) {
              let remaining = word;
              while (remaining.length > maxChars) {
                lines.push(remaining.substring(0, maxChars));
                remaining = remaining.substring(maxChars);
              }
              currentLine = remaining;
            } else {
              currentLine = word;
            }
          }
        }

        if (currentLine) lines.push(currentLine);
        return { lines, fontSize: currentFontSize };
      };

      const escapedWord = escapeText(word);
      const escapedDesc = escapeText(description);
      const escapedExample = escapeText(example);
      const escapedExampleDesc = escapeText(exampleDescription);

      const wordColor = type == 0 ? this.character[1] : this.character[0];
      const descColor = type == 0 ? this.character[1] : this.character[0];
      const exampleColor = type == 0 ? this.character[0] : this.character[1];
      const exampleDescColor = type == 0 ? this.character[0] : this.character[1];

      const wordBaseFontSize = word.length > 15 ? 80 : 100;
      const descBaseFontSize = description.length > 25 ? 50 : 60;
      const exampleBaseFontSize = example.length > 50 ? 60 : 80;
      const exampleDescBaseFontSize = exampleDescription.length > 30 ? 40 : 50;

      const wordMinFontSize = 40;
      const descMinFontSize = 30;
      const exampleMinFontSize = 30;
      const exampleDescMinFontSize = 24;

      const wordResult = wrapText(escapedWord, wordBaseFontSize, wordMinFontSize, 20);
      const descResult = wrapText(escapedDesc, descBaseFontSize, descMinFontSize, 40);
      const exampleResult = example
        ? wrapText(escapedExample, exampleBaseFontSize, exampleMinFontSize, 60)
        : { lines: [], fontSize: exampleBaseFontSize };
      const exampleDescResult = exampleDescription
        ? wrapText(escapedExampleDesc, exampleDescBaseFontSize, exampleDescMinFontSize, 50)
        : { lines: [], fontSize: exampleDescBaseFontSize };

      const wordFontSize = wordResult.fontSize;
      const descFontSize = descResult.fontSize;
      const exampleFontSize = exampleResult.fontSize;
      const exampleDescFontSize = exampleDescResult.fontSize;

      const wordLines = wordResult.lines;
      const descLines = descResult.lines;
      const exampleLines = exampleResult.lines;
      const exampleDescLines = exampleDescResult.lines;

      const fontName = 'Microsoft YaHei';

      const blockSpacing = 80;
      const lineSpacing = 60;

      const command = Ffmpeg()
        .input('color=c=black:s=' + this.VIDEO_PARAMS.size + ':d=' + videoDuration)
        .inputFormat('lavfi')
        .inputOptions(['-r', '30'])
        .input(audioPath)
        .input('anullsrc=channel_layout=mono:sample_rate=48000')
        .inputFormat('lavfi')
        .inputOptions(['-t', videoDuration]);

      let filterComplexParts = [];

      filterComplexParts.push('[1:a]aresample=async=1,apad[a1]');
      filterComplexParts.push('[2:a]volume=0.5[a2]');
      filterComplexParts.push('[a1][a2]amix=inputs=2:duration=first[aout]');

      const wordBlockHeight = wordLines.length * (wordFontSize + lineSpacing);
      const descBlockHeight = descLines.length * (descFontSize + lineSpacing);
      const exampleBlockHeight = exampleLines.length * (exampleFontSize + lineSpacing);
      const exampleDescBlockHeight = exampleDescLines.length * (exampleDescFontSize + lineSpacing);

      const totalHeight =
        wordBlockHeight +
        descBlockHeight +
        (exampleLines.length > 0 ? exampleBlockHeight + blockSpacing : 0) +
        (exampleDescLines.length > 0 ? exampleDescBlockHeight + blockSpacing : 0);

      const startY = 540 - totalHeight / 2;

      if (imagePath != '' && fs.existsSync(imagePath)) {
        command.input(imagePath);

        filterComplexParts.push(`color=c=${this.background.replace('#', '0x')}:s=1920x1080[bg]`);
        filterComplexParts.push(
          '[3:v]scale=800:800:force_original_aspect_ratio=increase,crop=800:800[img]'
        );
        filterComplexParts.push('[bg][img]overlay=80:140[combined]');

        let lastLabel = 'combined';
        let nextLabel = '';
        let currentY = startY;

        for (let i = 0; i < wordLines.length; i++) {
          nextLabel = i === wordLines.length - 1 ? 'word_complete' : `word_${i}`;
          const yOffset = currentY + i * (wordFontSize + lineSpacing);
          const textLine = `[${lastLabel}]drawtext=font=${fontName}:fontsize=${wordFontSize}:fontcolor=${wordColor}:x=960+(960-text_w)/2:y=${yOffset}:text='${wordLines[i]}'[${nextLabel}]`;
          filterComplexParts.push(textLine);
          lastLabel = nextLabel;
        }

        currentY += wordBlockHeight + blockSpacing;

        for (let i = 0; i < descLines.length; i++) {
          nextLabel = i === descLines.length - 1 ? 'desc_complete' : `desc_${i}`;
          const yOffset = currentY + i * (descFontSize + lineSpacing);
          const textLine = `[${lastLabel}]drawtext=font=${fontName}:fontsize=${descFontSize}:fontcolor=${descColor}:x=960+(960-text_w)/2:y=${yOffset}:text='${descLines[i]}'[${nextLabel}]`;
          filterComplexParts.push(textLine);
          lastLabel = nextLabel;
        }

        currentY += descBlockHeight + blockSpacing;

        if (exampleLines.length > 0) {
          for (let i = 0; i < exampleLines.length; i++) {
            nextLabel = i === exampleLines.length - 1 ? 'example_complete' : `example_${i}`;
            const yOffset = currentY + i * (exampleFontSize + lineSpacing);
            const textLine = `[${lastLabel}]drawtext=font=${fontName}:fontsize=${exampleFontSize}:fontcolor=${exampleColor}:x=960+(960-text_w)/2:y=${yOffset}:text='${exampleLines[i]}'[${nextLabel}]`;
            filterComplexParts.push(textLine);
            lastLabel = nextLabel;
          }

          currentY += exampleBlockHeight + blockSpacing;
        }

        if (exampleDescLines.length > 0) {
          for (let i = 0; i < exampleDescLines.length; i++) {
            nextLabel = i === exampleDescLines.length - 1 ? 'vout' : `example_desc_${i}`;
            const yOffset = currentY + i * (exampleDescFontSize + lineSpacing);
            const textLine = `[${lastLabel}]drawtext=font=${fontName}:fontsize=${exampleDescFontSize}:fontcolor=${exampleDescColor}:x=960+(960-text_w)/2:y=${yOffset}:text='${exampleDescLines[i]}'[${nextLabel}]`;
            filterComplexParts.push(textLine);
            lastLabel = nextLabel;
          }
        } else if (lastLabel !== 'vout') {
          filterComplexParts.push(`[${lastLabel}]copy[vout]`);
        }
      } else {
        filterComplexParts.push(`color=c=${this.background.replace('#', '0x')}:s=1920x1080[bg]`);

        let lastLabel = 'bg';
        let nextLabel = '';

        let currentY = startY;

        for (let i = 0; i < wordLines.length; i++) {
          nextLabel = i === wordLines.length - 1 ? 'word_complete' : `word_${i}`;
          const yOffset = currentY + i * (wordFontSize + lineSpacing);
          const textLine = `[${lastLabel}]drawtext=font=${fontName}:fontsize=${wordFontSize}:fontcolor=${wordColor}:x=(w-text_w)/2:y=${yOffset}:text='${wordLines[i]}'[${nextLabel}]`;
          filterComplexParts.push(textLine);
          lastLabel = nextLabel;
        }

        currentY += wordBlockHeight + blockSpacing;

        for (let i = 0; i < descLines.length; i++) {
          nextLabel = i === descLines.length - 1 ? 'desc_complete' : `desc_${i}`;
          const yOffset = currentY + i * (descFontSize + lineSpacing);
          const textLine = `[${lastLabel}]drawtext=font=${fontName}:fontsize=${descFontSize}:fontcolor=${descColor}:x=(w-text_w)/2:y=${yOffset}:text='${descLines[i]}'[${nextLabel}]`;
          filterComplexParts.push(textLine);
          lastLabel = nextLabel;
        }

        currentY += descBlockHeight + blockSpacing;

        if (exampleLines.length > 0) {
          for (let i = 0; i < exampleLines.length; i++) {
            nextLabel = i === exampleLines.length - 1 ? 'example_complete' : `example_${i}`;
            const yOffset = currentY + i * (exampleFontSize + lineSpacing);
            const textLine = `[${lastLabel}]drawtext=font=${fontName}:fontsize=${exampleFontSize}:fontcolor=${exampleColor}:x=(w-text_w)/2:y=${yOffset}:text='${exampleLines[i]}'[${nextLabel}]`;
            filterComplexParts.push(textLine);
            lastLabel = nextLabel;
          }

          currentY += exampleBlockHeight + blockSpacing;
        }

        if (exampleDescLines.length > 0) {
          for (let i = 0; i < exampleDescLines.length; i++) {
            nextLabel = i === exampleDescLines.length - 1 ? 'vout' : `example_desc_${i}`;
            const yOffset = currentY + i * (exampleDescFontSize + lineSpacing);
            const textLine = `[${lastLabel}]drawtext=font=${fontName}:fontsize=${exampleDescFontSize}:fontcolor=${exampleDescColor}:x=(w-text_w)/2:y=${yOffset}:text='${exampleDescLines[i]}'[${nextLabel}]`;
            filterComplexParts.push(textLine);
            lastLabel = nextLabel;
          }
        } else if (lastLabel !== 'vout') {
          filterComplexParts.push(`[${lastLabel}]copy[vout]`);
        }
      }

      const filterComplexString = filterComplexParts.join(';');

      command
        .addOption('-filter_complex', filterComplexString)
        .addOption('-map', '[vout]')
        .addOption('-map', '[aout]')
        .outputOptions([
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-profile:v',
          'baseline',
          '-level',
          '3.0',
          '-pix_fmt',
          'yuv420p',
          '-c:a',
          this.AUDIO_PARAMS.codec,
          '-b:a',
          this.AUDIO_PARAMS.bitrate,
          '-ar',
          this.AUDIO_PARAMS.sampleRate,
          '-ac',
          this.AUDIO_PARAMS.channels,
          '-r',
          '30',
          '-vsync',
          'cfr',
          '-t',
          videoDuration,
        ]);

      command
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', err => {
          Logger.getInstance().error(
            `Error in createWordVideoSegmentWithAudio: ${err}`,
            'generator'
          );
          reject(err);
        })
        .run();
    });
  }

  private async getAudioDuration(audioPath: string): Promise<number> {
    return new Promise(resolve => {
      Ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          resolve(0);
          return;
        }

        if (!metadata.format || typeof metadata.format.duration !== 'number') {
          resolve(0);
          return;
        }

        resolve(metadata.format.duration);
      });
    });
  }

  private async mergeVideos(
    videoPath: string,
    videoSegments: string[],
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const listPath = path.join(videoPath, 'video_list.txt');
      const fileContent = videoSegments
        .map(file => `file '${file.replace(/\\/g, '/')}'`)
        .join('\n');
      fs.writeFileSync(listPath, fileContent);

      Ffmpeg()
        .input(listPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions([
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-profile:v',
          'baseline',
          '-level',
          '3.0',
          '-pix_fmt',
          'yuv420p',
          '-c:a',
          this.AUDIO_PARAMS.codec,
          '-b:a',
          this.AUDIO_PARAMS.bitrate,
          '-ar',
          this.AUDIO_PARAMS.sampleRate,
          '-ac',
          this.AUDIO_PARAMS.channels,
          '-r',
          '30',
          '-vsync',
          'cfr',
          '-async',
          '1',
          '-af',
          'aresample=async=1000',
          '-max_interleave_delta',
          '0',
        ])
        .output(outputPath)
        .on('end', () => {
          fs.unlinkSync(listPath);
          resolve();
        })
        .on('error', err => {
          fs.unlinkSync(listPath);
          reject(err);
        })
        .run();
    });
  }
}
