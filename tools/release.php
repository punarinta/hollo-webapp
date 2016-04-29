<?php

echo "Setting up...\n";

chdir(__DIR__);

$configFile = ($_SERVER['argc'] == 2) ? $_SERVER['argv'][1] : 'config.json';
$config = json_decode(file_get_contents(__DIR__ . '/' . $configFile), true);

chdir($config['root']);

if (!file_exists($distDir = __DIR__ . '/' . $config['dist']))
{
    mkdir($distDir);
}

file_put_contents($distDir . '/min.js', '');

foreach ($config['js'] as $file)
{
    echo "File '$file'...\n";
    shell_exec("yui-compressor $file -o $distDir/temp.js");
    file_put_contents($distDir . '/min.js', file_get_contents($distDir . '/temp.js'), FILE_APPEND);
}
foreach ($config['css'] as $file)
{
    echo "File '$file'...\n";
    shell_exec("yui-compressor $file -o $distDir/temp.css");
    file_put_contents($distDir . '/min.css', file_get_contents($distDir . '/temp.css'), FILE_APPEND);
}

$html = file_get_contents($config['index']);

$search = ['/\>[^\S ]+/s', '/[^\S ]+\</s', '/(\s)+/s', '#<!-- DEV -->(.*?)<!-- END -->#is'];
$replace = ['>', '<', '\\1', ''];
$html = preg_replace($search, $replace, $html);

$html = strtr($html, ['> ' => '>', ' <' => '<']);
$html = str_replace('<!-- CSS -->', '<link rel="stylesheet" type="text/css" href="/min.css" />', $html);
$html = str_replace('<!-- JS -->', '<script src="/min.js"></script>', $html);

file_put_contents($distDir . '/index.html', $html);

echo "Copying assets...\n";
shell_exec("cp favicon.ico $distDir/favicon.ico");
shell_exec("cp -R css/ic_black $distDir/ic_black");

echo "Cleaning up...\n";
unlink($distDir . '/temp.js');
unlink($distDir . '/temp.css');
