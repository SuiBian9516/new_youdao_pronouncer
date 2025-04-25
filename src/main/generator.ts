import Ffmpeg from "fluent-ffmpeg";
import { Item } from "./database";
import { is } from "@electron-toolkit/utils";
import Logger from "./logger";
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffprobePath from "@ffprobe-installer/ffprobe";
import * as fs from 'fs';
import path, { join } from "path";

export default class Generator{
  private background:string;
  private character:[string,string];

  private readonly AUDIO_PARAMS = {
    codec: 'aac',
    bitrate: '192k',
    sampleRate: '48000',
    channels: '1'
  };

  private readonly VIDEO_PARAMS = {
    fps: '30',
    codec: 'libx264',
    preset: 'ultrafast',
    size: '1920x1080'
  };

  constructor(background:string,character:[string,string]){
    this.background = background;
    this.character = character;
    if(is.dev){
      Ffmpeg.setFfmpegPath(ffmpegPath.path);
      Ffmpeg.setFfprobePath(ffprobePath.path);
    }else{
      Ffmpeg.setFfmpegPath(ffmpegPath.path.replace('app.asar', 'app.asar.unpacked'));
      Ffmpeg.setFfprobePath(ffprobePath.path.replace('app.asar', 'app.asar.unpacked'));
    }
  }

  public async generate_videos(title:string,subtitle:string,videoPath:string,data:Item[],dest:string){
    await this.createTextVideo(join(videoPath,"start.mp4"),title,subtitle,2);
    let files = [join(videoPath,"start.mp4")];
    for(let i = 0;i < data.length;i++){
        for(let j = 0;j<data[i].count;j++){
            const item = data[i];
            const audioPath = item.audio[0];
            const imagePath = item.image;
            const example = item.example;
            const exampleDescription = item.description[1];
            const word = item.name;
            const description = item.description[0];
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
            files.push(path.join(videoPath,`${item.id}_item_${j}.mp4`));
            if(example !=''){
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
                files.push(path.join(videoPath,`${item.id}_example_${j}.mp4`));
            }
        }
    }

    await this.mergeVideos(videoPath,files,dest);
  }

  private createTextVideo(outputPath: string, title: string, description: string, duration: number): Promise<void> {
    // 增强文本处理功能，确保所有单引号都被正确替换
    const escapedTitle = title
        .replace(/(['])/g, '\\\\$1')  // 替换单引号
        .replace(/\n/g, '\\n');     // 替换换行符
    const escapedDes = description
        .replace(/(['])/g, '\\$1')  // 替换单引号
        .replace(/\n/g, '\\\\n');     // 替换换行符
    
    const titleFontColor = this.character[0];
    const descFontColor = this.character[0];
    
    // 直接使用黑体字体，不再使用路径
    const fontName = 'SimHei';
    
    const titleFontSize = title.length > 20 ? 80 : 120;
    const descFontSize = description.length > 30 ? 50 : 80;
    
    return new Promise((resolve, reject) => {
        const command = Ffmpeg()
            .input(`color=c=${this.background.replace('#', '0x')}:s=1920x1080:d=${duration}`)
            .inputFormat('lavfi')
            .input('anullsrc=channel_layout=mono:sample_rate=48000')
            .inputFormat('lavfi')
            .inputOptions(['-t', duration.toString()])
            .addOption('-vf', `drawtext=font='${fontName}':text='${escapedTitle}':fontsize=${titleFontSize}:fontcolor=${titleFontColor}:x=(w-text_w)/2:y=(h-text_h)/2-100,` +
                `drawtext=font='${fontName}':text='${escapedDes}':fontsize=${descFontSize}:fontcolor=${descFontColor}:x=(w-text_w)/2:y=(h-text_h)/2+100`)
            .outputOptions([
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-profile:v', 'high',
                '-level', '4.0',
                '-pix_fmt', 'yuv420p',
                '-c:a', this.AUDIO_PARAMS.codec,
                '-b:a', this.AUDIO_PARAMS.bitrate,
                '-ar', this.AUDIO_PARAMS.sampleRate,
                '-ac', this.AUDIO_PARAMS.channels,
                '-r', '30',
                '-vsync', '1'
            ]);

        command.output(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => {
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
    type:0|1 = 0
): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const audioDuration = await this.getAudioDuration(audioPath);
        const videoDuration = (audioDuration * 2).toFixed(3);
        
        const escapedWord = word
            .replace(/'/g, "\\\\'")
            .replace(/\n/g, '\\n');
        
        const escapedDesc = description
            .replace(/'/g, "\\\'") 
            .replace(/\n/g, '\\n');

        const escapedExample = example
            .replace(/'/g, "\\\\'")
            .replace(/\n/g, '\\n');
        const escapedExampleDesc = exampleDescription
            .replace(/'/g, "\\\\'")
            .replace(/\n/g, '\\n');;
        
        const wordColor = type == 0? this.character[1] : this.character[0];
        const descColor = type == 0? this.character[1] : this.character[0];
        const exampleColor = type == 0? this.character[0] : this.character[1];
        const exampleDescColor = type == 0? this.character[0] : this.character[1];

        const wordFontSize = word.length > 15 ? 60 : 100;
        const descFontSize = description.length > 25 ? 40 : 60;
        const exampleFontSize = example.length > 50 ? 40 : 80;
        const exampleDescFontSize = exampleDescription.length > 30 ? 30 : 50;
        const fontName = 'SimHei';
        const command = Ffmpeg()
            .input('color=c=black:s=' + this.VIDEO_PARAMS.size + ':d=' + videoDuration)
            .inputFormat('lavfi')
            .inputOptions(['-r', '30'])
            .input(audioPath)
            .input('anullsrc=channel_layout=mono:sample_rate=48000')
            .inputFormat('lavfi')
            .inputOptions(['-t', videoDuration]);

        if (imagePath != '' && fs.existsSync(imagePath)) {
            command.input(imagePath);
            let filterComplex = [
                `color=c=${this.background.replace('#', '0x')}:s=1920x1080[bg];`,
                '[3:v]scale=800:800:force_original_aspect_ratio=increase,crop=800:800[img];',
                '[bg][img]overlay=80:140[combined];',
                `[combined]drawtext=font='${fontName}':text='${escapedWord}':fontsize=${wordFontSize}:fontcolor=${wordColor}:x=960+(960-text_w)/2:y=(h-text_h)/2-200,`,
                `drawtext=font='${fontName}':text='${escapedDesc}':fontsize=${descFontSize}:fontcolor=${descColor}:x=960+(960-text_w)/2:y=(h-text_h)/2-100`
            ];
            
            if (example !== '') {
                filterComplex.push(`,drawtext=font='${fontName}':text='${escapedExample}':fontsize=${exampleFontSize}:fontcolor=${exampleColor}:x=960+(960-text_w)/2:y=(h-text_h)/2+70`);
            }
            
            if (exampleDescription !== '') {
                filterComplex.push(`,drawtext=font='${fontName}':text='${escapedExampleDesc}':fontsize=${exampleDescFontSize}:fontcolor=${exampleDescColor}:x=960+(960-text_w)/2:y=(h-text_h)/2+150`);
            }
            
            filterComplex.push('[v]');
            
            command.addOption('-filter_complex', filterComplex.join(''));
        } else {
            let filterComplex = [
                `color=c=${this.background.replace('#', '0x')}:s=1920x1080[bg];`,
                `[bg]drawtext=font='${fontName}':text=${JSON.stringify(escapedWord).slice(1, -1).replace(/"/g, '\\"')}:fontsize=${wordFontSize}:fontcolor=${wordColor}:x=(w-text_w)/2:y=(h-text_h)/2-200,`,
                `drawtext=font='${fontName}':text=${JSON.stringify(escapedDesc).slice(1, -1).replace(/"/g, '\\"')}:fontsize=${descFontSize}:fontcolor=${descColor}:x=(w-text_w)/2:y=(h-text_h)/2-100`
            ];
            
            // 添加示例文本（如果有）
            if (example !== '') {
                filterComplex.push(`,drawtext=font='${fontName}':text=${JSON.stringify(escapedExample).slice(1, -1).replace(/"/g, '\\"')}:fontsize=${exampleFontSize}:fontcolor=${exampleColor}:x=(w-text_w)/2:y=(h-text_h)/2+70`);
            }
            
            // 添加示例描述（如果有）
            if (exampleDescription !== '') {
                filterComplex.push(`,drawtext=font='${fontName}':text=${JSON.stringify(escapedExampleDesc).slice(1, -1).replace(/"/g, '\\"')}:fontsize=${exampleDescFontSize}:fontcolor=${exampleDescColor}:x=(w-text_w)/2:y=(h-text_h)/2+150`);
            }
            
            // 始终添加[v]标签
            filterComplex.push('[v]');
            
            command.addOption('-filter_complex', filterComplex.join(''));
        }

        // 音频处理保持不变
        command.addOption('-filter_complex',
            `[1:a]aresample=async=1,apad[a1];` +
            `[2:a]volume=0.5[a2];` +
            `[a1][a2]amix=inputs=2:duration=first[aout]`
        )
        .addOption('-map', '[v]')
        .addOption('-map', '[aout]')
        .outputOptions([
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-profile:v', 'baseline',
            '-level', '3.0',
            '-pix_fmt', 'yuv420p',
            '-c:a', this.AUDIO_PARAMS.codec,
            '-b:a', this.AUDIO_PARAMS.bitrate,
            '-ar', this.AUDIO_PARAMS.sampleRate,
            '-ac', this.AUDIO_PARAMS.channels,
            '-r', '30',
            '-vsync', 'cfr',
            '-t', videoDuration
        ]);

        command.output(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => {
                Logger.getInstance().error(`Error in createWordVideoSegmentWithAudio: ${err}`, 'generator');
                reject(err);
            })
            .run();
    });
}

  private async getAudioDuration(audioPath: string): Promise<number> {
    return new Promise((resolve) => {
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

  private async mergeVideos(videoPath:string,videoSegments: string[], outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const listPath = path.join(videoPath, 'video_list.txt');
        const fileContent = videoSegments.map(file => `file '${file.replace(/\\/g, '/')}'`).join('\n');
        fs.writeFileSync(listPath, fileContent);

        Ffmpeg()
            .input(listPath)
            .inputOptions(['-f', 'concat', '-safe', '0'])
            .outputOptions([
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-profile:v', 'baseline',
                '-level', '3.0',
                '-pix_fmt', 'yuv420p',
                '-c:a', this.AUDIO_PARAMS.codec,
                '-b:a', this.AUDIO_PARAMS.bitrate,
                '-ar', this.AUDIO_PARAMS.sampleRate,
                '-ac', this.AUDIO_PARAMS.channels,
                '-r', '30',
                '-vsync', 'cfr',
                '-async', '1',
                '-af', 'aresample=async=1000',
                '-max_interleave_delta', '0'
            ])
            .output(outputPath)
            .on('end', () => {
                fs.unlinkSync(listPath);
                resolve();
            })
            .on('error', (err) => {
                fs.unlinkSync(listPath);
                reject(err);
            })
            .run();
    });
  }
}