<?php

echo "Setting up...\n";

chdir(__DIR__);

$configFile = ($_SERVER['argc'] == 2) ? $_SERVER['argv'][1] : 'config.json';
$config = json_decode(file_get_contents(__DIR__ . '/' . $configFile), true);

chdir($config['root']);
$distDir = __DIR__ . '/' . $config['dist'];

shell_exec("rm -rf $distDir");
mkdir($distDir);

$random = uniqid();

foreach ($config['js'] as $file)
{
    echo "File '$file'...\n";
    shell_exec("yui-compressor $file -o $distDir/temp.js");
    file_put_contents("$distDir/$random.js", file_get_contents("$distDir/temp.js"), FILE_APPEND);
}
foreach ($config['css'] as $file)
{
    echo "File '$file'...\n";
    shell_exec("yui-compressor $file -o $distDir/temp.css");
    file_put_contents("$distDir/$random.css", file_get_contents("$distDir/temp.css"), FILE_APPEND);
}

$html = file_get_contents($config['index']);

$search = ['/\>[^\S ]+/s', '/[^\S ]+\</s', '/(\s)+/s', '#<!-- DEV -->(.*?)<!-- END -->#is'];
$replace = ['>', '<', '\\1', ''];
$html = preg_replace($search, $replace, $html);

$html = strtr($html, ['> ' => '>', ' <' => '<']);
$html = str_replace('<!-- CSS -->', '<link rel="stylesheet" type="text/css" href="/' . $random . '.css" />', $html);
$html = str_replace('<!-- JS -->', '<script src="/' . $random . '.js"></script>', $html);

file_put_contents($distDir . '/index.html', $html);

echo "Copying assets...\n";
shell_exec("cp favicon.ico $distDir/favicon.ico");
shell_exec("cp -R css/ic_black $distDir/ic_black");
shell_exec("cp -R css/ic_white $distDir/ic_white");
shell_exec("cp -R gfx $distDir/gfx");

echo "Cleaning up...\n";
unlink("$distDir/temp.js");
unlink("$distDir/temp.css");
