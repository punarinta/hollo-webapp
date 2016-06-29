<?php

function prefixify($text = '', $prefixes = [], $prefixed = [])
{
    $textLines = explode("\n", $text);

    for ($i = 0; $i < count($textLines); $i++)
    {
        $style = explode(':', $textLines[$i]);
        $style = trim($style[0]);

        foreach ($prefixed as $instruction)
        {
            if ($style == $instruction[0])
            {
                foreach ($instruction[1] as $pfx)
                {
                    $extraTextLine = str_replace($style, $prefixes[$pfx] . $style, $textLines[$i]);
                    array_splice($textLines, $i + 1, 0, $extraTextLine);

                    echo "$style - $extraTextLine\n";
                }
            }
        }
    }

    return implode("\n", $textLines);
}

echo "Setting up...\n";

chdir(__DIR__);

$configFile = ($_SERVER['argc'] == 2) ? $_SERVER['argv'][1] : 'config.json';
$config = json_decode(file_get_contents(__DIR__ . '/' . $configFile), true);

chdir($config['root']);
$distDir = __DIR__ . '/' . $config['dist'];

shell_exec("rm -rf $distDir");
mkdir($distDir);
mkdir("$distDir/modules");

$random = uniqid();

echo "Running pre scripts...\n";
foreach ($config['pre-shell'] as $sh)
{
    echo "$sh\n";
    shell_exec(str_replace('$distDir', $distDir, $sh));
}

foreach ($config['js'] as $file)
{
    echo "Script '$file.js'...\n";
    shell_exec("yui-compressor $file.js -o $distDir/temp.js");
    file_put_contents("$distDir/$random.js", file_get_contents("$distDir/temp.js"), FILE_APPEND);
}
foreach ($config['mods'] as $file)
{
    echo "Module '$file.js'...\n";
    shell_exec("yui-compressor modules/$file.js -o $distDir/modules/$file.js");
}
foreach ($config['css']['files'] as $file)
{
    echo "Style '$file.css'...\n";

    $cssData = prefixify(file_get_contents("$file.css"), $config['css']['prefixes'], $config['css']['prefixed']);
    file_put_contents("$file.css", $cssData);

    shell_exec("yui-compressor $file.css -o $distDir/temp.css");

    file_put_contents("$distDir/$random.css", file_get_contents("$distDir/temp.css"), FILE_APPEND);
}

$html = file_get_contents($config['index']);

$search = ['/\>[^\S ]+/s', '/[^\S ]+\</s', '/(\s)+/s', '#<!-- DEV -->(.*?)<!-- /DEV -->#is'];
$replace = ['>', '<', '\\1', ''];
$html = preg_replace($search, $replace, $html);

$html = strtr($html, ['> ' => '>', ' <' => '<']);
$html = str_replace('<!-- CSS -->', '<link rel="stylesheet" type="text/css" href="/' . $random . '.css" />', $html);
$html = str_replace('<!-- JS -->', '<script src="/' . $random . '.js"></script>', $html);
$html = str_replace('<!-- VERSION -->dev<!-- /VERSION -->', date('d.m.Y H:i'), $html);

file_put_contents($distDir . '/index.html', $html);

echo "Running post scripts...\n";
foreach ($config['post-shell'] as $sh)
{
    echo "$sh\n";
    shell_exec(str_replace('$distDir', $distDir, $sh));
}

echo "Cleaning up...\n";
unlink("$distDir/temp.js");
unlink("$distDir/temp.css");
