// 新しい話の試し書き用（本番の Root に入れる前に静止画で確認する）
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Ep06} from './house/Ep06';
const Dev: React.FC = () => <Composition id="Dev" component={Ep06} durationInFrames={600} fps={30} width={1080} height={1920} />;
registerRoot(Dev);
