<?php

$mixpanel = '<!-- start Mixpanel --><script type="text/javascript">(function(e,a){if(!a.__SV){var b=window;try{var c,l,i,j=b.location,g=j.hash;c=function(a,b){return(l=a.match(RegExp(b+"=([^&]*)")))?l[1]:null};g&&c(g,"state")&&(i=JSON.parse(decodeURIComponent(c(g,"state"))),"mpeditor"===i.action&&(b.sessionStorage.setItem("_mpcehash",g),history.replaceState(i.desiredHash||"",e.title,j.pathname+j.search)))}catch(m){}var k,h;window.mixpanel=a;a._i=[];a.init=function(b,c,f){function e(b,a){var c=a.split(".");2==c.length&&(b=b[c[0]],a=c[1]);b[a]=function(){b.push([a].concat(Array.prototype.slice.call(arguments,
0)))}}var d=a;"undefined"!==typeof f?d=a[f]=[]:f="mixpanel";d.people=d.people||[];d.toString=function(b){var a="mixpanel";"mixpanel"!==f&&(a+="."+f);b||(a+=" (stub)");return a};d.people.toString=function(){return d.toString(1)+".people (stub)"};k="disable time_event track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config reset people.set people.set_once people.increment people.append people.union people.track_charge people.clear_charges people.delete_user".split(" ");
for(h=0;h<k.length;h++)e(d,k[h]);a._i.push([b,c,f])};a.__SV=1.2;b=e.createElement("script");b.type="text/javascript";b.async=!0;b.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===e.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\/\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";c=e.getElementsByTagName("script")[0];c.parentNode.insertBefore(b,c)}})(document,window.mixpanel||[]);
mixpanel.init("31bad9d76002414acd3b68cc290a03e7");</script><!-- end Mixpanel -->';

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
    $js = file_get_contents("$distDir/temp.js");
    $js = preg_replace('#[\x5C]n\s{2,}#', ' ', $js);
    file_put_contents("$distDir/$random.js", $js, FILE_APPEND);
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
$html = str_replace('<!-- CSS -->', '<style>' . file_get_contents("$distDir/$random.css") . '</style>', $html);
$html = str_replace('<!-- JS -->', '<script>' . file_get_contents("$distDir/$random.js") . '</script>' . $mixpanel, $html);
$html = str_replace('<!-- VERSION -->dev<!-- /VERSION -->', date('d.m.Y H:i'), $html);

file_put_contents($distDir . '/index.html', $html);

echo "Running post scripts...\n";
foreach ($config['post-shell'] as $sh)
{
    echo "$sh\n";
    shell_exec(str_replace('$distDir', $distDir, $sh));
}

echo "Estimated GZIP size: ";
system('gzip -c dist/index.html | wc -c');

echo "Cleaning up...\n";
unlink("$distDir/temp.js");
unlink("$distDir/temp.css");
unlink("$distDir/$random.css");
unlink("$distDir/$random.js");
