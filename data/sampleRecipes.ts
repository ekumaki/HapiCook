// サンプルレシピデータ (開発用)
import { Recipe } from '../types/recipe';

export const SAMPLE_RECIPES: Recipe[] = [
    {
        id: '1',
        title: '豚バラと白菜のレンジ蒸し',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
        tags: ['豚肉', '白菜', 'レンジ', '時短', '和食'],
        servings: '2人分',
        metadata: {
            estimatedTime: '10分',
            calories: '350kcal',
        },
        ingredients: [
            { name: '豚バラ薄切り肉', quantity: '200g' },
            { name: '白菜', quantity: '1/4株' },
            { name: '酒', quantity: '大さじ2' },
            { name: '鶏ガラスープの素', quantity: '小さじ1' },
            { name: '塩こしょう', quantity: '少々' },
            { name: 'ポン酢', quantity: '適量' },
            { name: '小ねぎ', quantity: '適量' },
        ],
        steps: [
            '白菜は3-4cm幅のざく切りにする。豚肉は5cm幅に切る。',
            '耐熱容器に白菜の半量を敷き詰め、その上に豚肉の半量を広げて乗せる。',
            '残りの白菜、豚肉の順に重ねる。',
            '酒、鶏ガラスープの素を回しかけ、ふんわりとラップをする。',
            '電子レンジ(600W)で8分〜10分加熱する。豚肉に火が通っていればOK。',
            '全体を軽く混ぜ合わせ、器に盛る。お好みで小ねぎを散らし、ポン酢をつけていただく。',
        ],
    },
    {
        id: '2',
        title: '基本のトマトパスタ',
        image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&q=80&w=800',
        tags: ['パスタ', 'トマト', 'ランチ', '定番'],
        servings: '1人分',
        metadata: {
            estimatedTime: '20分',
            calories: '600kcal',
        },
        ingredients: [
            { name: 'パスタ', quantity: '100g' },
            { name: 'ホールトマト缶', quantity: '1/2缶' },
            { name: 'にんにく', quantity: '1片' },
            { name: 'オリーブオイル', quantity: '大さじ2' },
            { name: '塩', quantity: '適量' },
            { name: 'バジル', quantity: '適量' },
        ],
        steps: [
            '大きめの鍋にお湯を沸かし、塩を加えてパスタを表示時間通りに茹でる。',
            'フライパンにオリーブオイルとみじん切りにしたにんにくを入れ、弱火で香りを出す。',
            'ホールトマトを加え、木べらで潰しながら中火で5分ほど煮詰める。',
            '茹で上がったパスタとゆで汁少々を加え、よく絡める。',
            '塩で味を調え、器に盛り付けてバジルを飾る。',
        ],
    },
    {
        id: '3',
        title: '鶏むね肉のさっぱり南蛮漬け',
        image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=800',
        tags: ['鶏肉', '和食', '作り置き', 'ヘルシー'],
        servings: '2人分',
        metadata: {
            estimatedTime: '25分',
            calories: '280kcal',
        },
        ingredients: [
            { name: '鶏むね肉', quantity: '1枚(300g)' },
            { name: '玉ねぎ', quantity: '1/2個' },
            { name: 'にんじん', quantity: '1/4本' },
            { name: '酢', quantity: '大さじ3' },
            { name: '醤油', quantity: '大さじ2' },
            { name: '砂糖', quantity: '大さじ1' },
            { name: '片栗粉', quantity: '適量' },
        ],
        steps: [
            '玉ねぎは薄切り、にんじんは千切りにする。酢、醤油、砂糖を混ぜ合わせておく。',
            '鶏むね肉は一口大のそぎ切りにし、片栗粉をまぶす。',
            'フライパンに油を熱し、鶏肉を両面こんがり焼く。',
            '熱いうちに合わせ調味料と野菜を加え、絡める。',
            '10分ほど漬け込んで完成。冷蔵庫で2-3日保存可能。',
        ],
    },
];
