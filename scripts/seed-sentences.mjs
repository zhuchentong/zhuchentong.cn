// scripts/seed-sentences.mjs
// 人教版三年级上册 + 下册 例句批量导入脚本
// 用法：先启动 dev server (pnpm dev)，再运行：node scripts/seed-sentences.mjs [baseURL]
// 幂等：可重复运行，已存在的 (word_id, sentence) 组合自动跳过
// 每词 1 句，共 221 词
import process from 'node:process'

const BASE = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '')

// ── 三年级下册（115 词）────────────────────────────────────────────

const unit1_down = [
  ['where', 'Where are you from?', '你来自哪里？'],
  ['from', 'I am from China.', '我来自中国。'],
  ['about', 'Tell me about your school.', '告诉我你的学校。'],
  ['today', 'Today is a nice day.', '今天是个好日子。'],
  ['teacher', 'My teacher is very kind.', '我的老师很和蔼。'],
  ['student', 'I am a student.', '我是一名学生。'],
  ['after', 'I play after school.', '放学后我玩耍。'],
  ['who', 'Who is he?', '他是谁？'],
  ['girl', 'The girl can sing.', '那个女孩会唱歌。'],
  ['neighbour', 'My neighbour is friendly.', '我的邻居很友好。'],
  ['boy', 'The boy has a dog.', '那个男孩有一只狗。'],
  ['woman', 'A kind woman helps me.', '一位善良的女士帮助我。'],
  ['man', 'The man is my father.', '那个男人是我爸爸。'],
  ['Mr', 'Mr Wang is our teacher.', '王老师是我们的老师。'],
  ['classmate', 'She is my classmate.', '她是我的同班同学。'],
  ['he', 'He is my friend.', '他是我的朋友。'],
  ['also', 'I also like dogs.', '我也喜欢狗。'],
  ['English', 'I like English class.', '我喜欢英语课。'],
  ['she', 'She is very happy.', '她非常开心。'],
  ['very', 'The cat is very cute.', '这只猫非常可爱。'],
  ['UK', 'He is from the UK.', '他来自英国。'],
  ['China', 'I am from China.', '我来自中国。'],
  ['Canada', 'She is from Canada.', '她来自加拿大。'],
  ['USA', 'He lives in the USA.', '他住在美国。'],
]

const unit2_down = [
  ['has', 'She has long hair.', '她有长长的头发。'],
  ['long', 'The snake is long.', '这条蛇很长。'],
  ['body', 'Touch your body.', '摸摸你的身体。'],
  ['short', 'The rabbit has a short tail.', '兔子的尾巴很短。'],
  ['leg', 'A spider has eight legs.', '蜘蛛有八条腿。'],
  ['right', 'Your answer is right.', '你的答案是正确的。'],
  ['fat', 'The pig is fat.', '这只猪很胖。'],
  ['thin', 'The cat is thin.', '这只猫很瘦。'],
  ['slow', 'The turtle walks slow.', '乌龟走得很慢。'],
  ['love', 'I love my family.', '我爱我的家人。'],
  ['tail', 'The dog wags its tail.', '狗摇尾巴。'],
  ['her', 'Give the book to her.', '把书给她。'],
  ['gift', 'I get a gift for my birthday.', '我生日得到了一份礼物。'],
  ['picture', 'I draw a picture.', '我画一幅画。'],
  ['card', 'I make a card for Mum.', '我给妈妈做了一张贺卡。'],
  ['sing', 'We sing a song together.', '我们一起唱一首歌。'],
  ['dance', 'She likes to dance.', '她喜欢跳舞。'],
  ['talk', 'We talk in English.', '我们用英语交谈。'],
  ['face', 'Wash your face every morning.', '每天早上洗脸。'],
  ['all', 'All the children are happy.', '所有的孩子都很开心。'],
  ['song', 'This song is nice.', '这首歌很好听。'],
  ['or', 'Do you like tea or coffee?', '你喜欢茶还是咖啡？'],
  ['so', 'I am so happy today.', '我今天很开心。'],
  ['much', 'Thank you so much.', '非常感谢你。'],
]

const unit3_down = [
  ['eraser', 'I have a new eraser.', '我有一块新橡皮。'],
  ['find', 'I can find my pen.', '我能找到我的钢笔。'],
  ['ruler', 'I have a long ruler.', '我有一把长直尺。'],
  ['pen', 'I write with a pen.', '我用钢笔写字。'],
  ['pencil', 'She draws with a pencil.', '她用铅笔画画。'],
  ['book', 'I read a book every day.', '我每天读一本书。'],
  ['bag', 'I carry my bag to school.', '我背着书包去上学。'],
  ['paper', 'Give me a piece of paper.', '给我一张纸。'],
  ['these', 'These are my books.', '这些是我的书。'],
  ['see', 'I can see a bird.', '我能看见一只鸟。'],
  ['smell', 'I smell the flowers.', '我闻闻花香。'],
  ['taste', 'The cake tastes good.', '这个蛋糕尝起来很好。'],
  ['hear', 'I hear a song.', '我听到一首歌。'],
  ['touch', 'Touch the ball, please.', '请摸摸这个球。'],
  ['nose', 'I have a small nose.', '我有一个小鼻子。'],
  ['tongue', 'Stick out your tongue.', '伸出你的舌头。'],
  ['class', 'I am in Class One.', '我在一班。'],
  ['in class', 'Listen carefully in class.', '在课堂上认真听讲。'],
  ['computer', 'I use a computer at home.', '我在家里用电脑。'],
  ['learn', 'We learn English at school.', '我们在学校学英语。'],
]

const unit4_down = [
  ['breakfast', 'I eat breakfast at home.', '我在家吃早餐。'],
  ['time', 'What time is it?', '现在几点了？'],
  ['bread', 'I have bread for breakfast.', '我早餐吃面包。'],
  ['egg', 'I eat an egg every day.', '我每天吃一个鸡蛋。'],
  ['milk', 'I drink milk in the morning.', '我早上喝牛奶。'],
  ['noodle', 'I like noodles.', '我喜欢面条。'],
  ['juice', 'I drink apple juice.', '我喝苹果汁。'],
  ['rice', 'We eat rice every day.', '我们每天吃大米。'],
  ['meat', 'I like to eat meat.', '我喜欢吃肉。'],
  ['vegetable', 'Eat more vegetables.', '多吃蔬菜。'],
  ['healthy', 'Fruit is healthy for you.', '水果对你很健康。'],
  ['plate', 'Put the food on the plate.', '把食物放在盘子里。'],
  ['soup', 'The soup is hot.', '这汤很烫。'],
  ['fruit', 'I like to eat fruit.', '我喜欢吃水果。'],
  ['colourful', 'The flowers are colourful.', '这些花五彩缤纷。'],
  ['candy', 'I like candy.', '我喜欢糖果。'],
  ['yummy', 'The cake is yummy.', '这个蛋糕很好吃。'],
]

const unit5_down = [
  ['boat', 'I see a boat on the lake.', '我看见湖上有一艘小船。'],
  ['cool', 'Your bike is cool!', '你的自行车真酷！'],
  ['keep', 'I keep a pet dog.', '我养了一只宠物狗。'],
  ['at', 'I am at home.', '我在家里。'],
  ['home', 'I go home after school.', '放学后我回家。'],
  ['ball', 'I have a red ball.', '我有一个红球。'],
  ['doll', 'She has a nice doll.', '她有一个漂亮的玩偶。'],
  ['car', 'The car is red.', '这辆车是红色的。'],
  ['on', 'The book is on the desk.', '书在书桌上。'],
  ['shelf', 'The books are on the shelf.', '书在架子上。'],
  ['in', 'The cat is in the box.', '猫在盒子里。'],
  ['box', 'Open the box, please.', '请打开盒子。'],
  ['cap', 'He wears a blue cap.', '他戴着一顶蓝色帽子。'],
  ['map', 'I see a map on the wall.', '我看到墙上有一张地图。'],
  ['under', 'The ball is under the bed.', '球在床下面。'],
  ['still', 'He is still at home.', '他还在家里。'],
  ['put', 'Put the book on the desk.', '把书放在书桌上。'],
]

const unit6_down = [
  ['fifteen', 'I am fifteen years old.', '我十五岁了。'],
  ['twelve', 'There are twelve months in a year.', '一年有十二个月。'],
  ['fourteen', 'I have fourteen pencils.', '我有十四支铅笔。'],
  ['thirteen', 'He is thirteen years old.', '他十三岁了。'],
  ['eleven', 'I see eleven birds.', '我看到十一只鸟。'],
  ['twenty', 'There are twenty students in my class.', '我的班有二十个学生。'],
  ['seventeen', 'She has seventeen books.', '她有十七本书。'],
  ['sixteen', 'Count to sixteen.', '数到十六。'],
  ['eighteen', 'My sister is eighteen.', '我姐姐十八岁了。'],
  ['nineteen', 'I have nineteen cards.', '我有十九张卡片。'],
  ['piggy bank', 'She puts coins in her piggy bank.', '她把硬币放进储钱罐。'],
  ['pay', 'Mum pays for the food.', '妈妈付了食物的钱。'],
  ['back', 'I go back to school.', '我回到学校。'],
]

// ── 三年级上册（106 词，orange 仅在 Unit4 列一次）──────────────────

const unit1_up = [
  ['name', 'My name is Lily.', '我的名字叫莉莉。'],
  ['nice', 'Nice to meet you!', '很高兴见到你！'],
  ['ear', 'I have two ears.', '我有两只耳朵。'],
  ['hand', 'Raise your hand, please.', '请举起你的手。'],
  ['eye', 'I have big eyes.', '我有大眼睛。'],
  ['mouth', 'Open your mouth.', '张开你的嘴。'],
  ['arm', 'Touch your arm.', '摸摸你的胳膊。'],
  ['can', 'I can swim.', '我会游泳。'],
  ['share', 'Let us share the cake.', '我们分享这个蛋糕吧。'],
  ['smile', 'She smiles at me.', '她对我微笑。'],
  ['listen', 'Listen to the teacher.', '听老师讲课。'],
  ['help', 'I help my mum at home.', '我在家帮妈妈。'],
  ['say', 'Say hello to her.', '向她问好。'],
  ['friend', 'He is my good friend.', '他是我的好朋友。'],
  ['good', 'Good morning, class!', '同学们，早上好！'],
]

const unit2_up = [
  ['mum', 'I love my mum.', '我爱我的妈妈。'],
  ['dad', 'My dad plays with me.', '爸爸和我一起玩。'],
  ['grandma', 'My grandma tells me stories.', '奶奶给我讲故事。'],
  ['grandpa', 'My grandpa likes tea.', '爷爷喜欢喝茶。'],
  ['grandmother', 'My grandmother is kind.', '我的祖母很和蔼。'],
  ['mother', 'My mother cooks for me.', '我妈妈给我做饭。'],
  ['father', 'My father is tall.', '我的父亲很高。'],
  ['grandfather', 'My grandfather is seventy.', '我的祖父七十岁了。'],
  ['me', 'Give it to me, please.', '请把它给我。'],
  ['sister', 'My sister is five.', '我妹妹五岁了。'],
  ['family', 'I love my family.', '我爱我的家人。'],
  ['have', 'I have a pet cat.', '我有一只宠物猫。'],
  ['big', 'The elephant is big.', '大象很大。'],
  ['cousin', 'My cousin and I play together.', '我和表哥一起玩。'],
  ['brother', 'My brother likes football.', '我哥哥喜欢足球。'],
  ['baby', 'The baby is sleeping.', '宝宝在睡觉。'],
  ['uncle', 'My uncle is a teacher.', '我叔叔是一名老师。'],
  ['aunt', 'My aunt gives me a book.', '阿姨给我一本书。'],
  ['small', 'The mouse is small.', '这只老鼠很小。'],
]

const unit3_up = [
  ['like', 'I like my pet dog.', '我喜欢我的宠物狗。'],
  ['dog', 'The dog runs fast.', '这只狗跑得很快。'],
  ['pet', 'I have a pet cat.', '我有一只宠物猫。'],
  ['cat', 'The cat sleeps on the bed.', '猫在床上睡觉。'],
  ['fish', 'I see a fish in the pond.', '我在池塘里看到一条鱼。'],
  ['bird', 'A bird sings in the tree.', '一只鸟在树上唱歌。'],
  ['rabbit', 'The rabbit is white.', '这只兔子是白色的。'],
  ['go', 'Let us go to the zoo.', '我们去动物园吧。'],
  ['zoo', 'We go to the zoo on Sunday.', '我们星期天去动物园。'],
  ['fox', 'The fox is clever.', '狐狸很聪明。'],
  ['Miss', 'Miss Li is our English teacher.', '李老师是我们的英语老师。'],
  ['panda', 'The panda eats bamboo.', '大熊猫吃竹子。'],
  ['red panda', 'The red panda is cute.', '小熊猫很可爱。'],
  ['cute', 'The kitten is so cute!', '这只小猫太可爱了！'],
  ['monkey', 'The monkey climbs the tree.', '猴子爬上树。'],
  ['tiger', 'The tiger is very strong.', '老虎非常强壮。'],
  ['elephant', 'The elephant has a long nose.', '大象有一个长鼻子。'],
  ['lion', 'The lion is strong.', '狮子很强壮。'],
  ['animal', 'The dog is a cute animal.', '狗是一种可爱的动物。'],
  ['giraffe', 'The giraffe is very tall.', '长颈鹿非常高。'],
  ['tall', 'She is tall.', '她很高。'],
  ['fast', 'The rabbit runs fast.', '兔子跑得快。'],
]

const unit4_up = [
  ['apple', 'I have a red apple.', '我有一个红苹果。'],
  ['banana', 'The banana is yellow.', '香蕉是黄色的。'],
  ['farm', 'We go to the farm.', '我们去农场。'],
  ['air', 'The air is fresh.', '空气很新鲜。'],
  ['orange', 'I eat an orange after lunch.', '午饭后我吃一个橙子。'],
  ['grape', 'Grapes are yummy.', '葡萄很好吃。'],
  ['school', 'I go to school every day.', '我每天去上学。'],
  ['garden', 'There are flowers in the garden.', '花园里有花。'],
  ['need', 'Plants need water.', '植物需要水。'],
  ['water', 'I water the flowers.', '我给花浇水。'],
  ['flower', 'The flower is beautiful.', '这朵花很漂亮。'],
  ['grass', 'The grass is green.', '草是绿色的。'],
  ['plant', 'We plant a tree in spring.', '我们在春天种一棵树。'],
  ['new', 'I have a new book.', '我有一本新书。'],
  ['tree', 'There is a tall tree.', '有一棵高大的树。'],
  ['sun', 'The sun is in the sky.', '太阳在天空中。'],
  ['give', 'Give me the book, please.', '请把书给我。'],
  ['them', 'I give them some water.', '我给他们一些水。'],
]

const unit5_up = [
  ['colour', 'What colour is it?', '它是什么颜色？'],
  ['green', 'The grass is green.', '草是绿色的。'],
  ['red', 'The apple is red.', '苹果是红色的。'],
  ['blue', 'The sky is blue.', '天空是蓝色的。'],
  ['make', 'I make a card for Mum.', '我给妈妈做了一张贺卡。'],
  ['purple', 'I like purple grapes.', '我喜欢紫色的葡萄。'],
  ['brown', 'The bear is brown.', '这只熊是棕色的。'],
  ['bear', 'The bear is in the forest.', '熊在森林里。'],
  ['yellow', 'The banana is yellow.', '香蕉是黄色的。'],
  ['duck', 'A duck swims in the lake.', '一只鸭子在湖里游泳。'],
  ['sea', 'The sea is blue.', '大海是蓝色的。'],
  ['some', 'I have some books.', '我有一些书。'],
  ['pink', 'I like pink flowers.', '我喜欢粉色的花。'],
  ['draw', 'I draw a picture.', '我画一幅画。'],
  ['white', 'The snow is white.', '雪是白色的。'],
  ['black', 'The cat is black.', '这只猫是黑色的。'],
]

const unit6_up = [
  ['old', 'How old are you?', '你几岁了？'],
  ['five', 'I have five books.', '我有五本书。'],
  ['year', 'I am seven years old.', '我七岁了。'],
  ['one', 'I have one brother.', '我有一个哥哥。'],
  ['two', 'I have two hands.', '我有两只手。'],
  ['three', 'There are three cats.', '有三只猫。'],
  ['four', 'A dog has four legs.', '狗有四条腿。'],
  ['ten', 'I can count to ten.', '我能数到十。'],
  ['six', 'There are six chairs.', '有六把椅子。'],
  ['seven', 'There are seven days in a week.', '一周有七天。'],
  ['eight', 'A spider has eight legs.', '蜘蛛有八条腿。'],
  ['nine', 'I have nine stickers.', '我有九张贴纸。'],
  ['o\'clock', 'I get up at seven o\'clock.', '我七点钟起床。'],
  ['cut', 'Cut the cake, please.', '请切蛋糕。'],
  ['eat', 'I eat breakfast at home.', '我在家吃早餐。'],
  ['cake', 'The cake is yummy.', '这个蛋糕很好吃。'],
]

// ── 组装数据 ──────────────────────────────────────────────────────

const units = [
  // 三年级下册
  { label: '下册 Unit 1', words: unit1_down },
  { label: '下册 Unit 2', words: unit2_down },
  { label: '下册 Unit 3', words: unit3_down },
  { label: '下册 Unit 4', words: unit4_down },
  { label: '下册 Unit 5', words: unit5_down },
  { label: '下册 Unit 6', words: unit6_down },
  // 三年级上册
  { label: '上册 Unit 1', words: unit1_up },
  { label: '上册 Unit 2', words: unit2_up },
  { label: '上册 Unit 3', words: unit3_up },
  { label: '上册 Unit 4', words: unit4_up },
  { label: '上册 Unit 5', words: unit5_up },
  { label: '上册 Unit 6', words: unit6_up },
]

// [word, sentence, translation] -> { word, sentences: [{sentence, translation}] }
const items = units.flatMap(u =>
  u.words.map(([word, sentence, translation]) => ({
    word,
    sentences: [{ sentence, translation }],
  })),
)

async function main() {
  console.log(`目标服务：${BASE}`)
  console.log(`待导入：${items.length} 个单词的例句\n`)

  const res = await fetch(`${BASE}/english/api/batch/sentences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`批量添加例句失败: ${json.error ?? res.status}`)
  }

  const result = json.data
  console.log(`  ✓ 总计 ${result.total} 条目`)
  console.log(`    附加例句 ${result.attached} 条`)
  console.log(`    未找到单词 ${result.missing} 个\n`)

  for (const u of units) {
    console.log(`  ${u.label}: ${u.words.length} 词`)
  }
  console.log('\n完成。')
}

main().catch((err) => {
  console.error('\n✗ 执行失败:', err.message)
  process.exit(1)
})
