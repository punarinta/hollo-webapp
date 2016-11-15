# https://christopher.su/2015/selenium-chromedriver-ubuntu/

import re
from selenium import webdriver
from time import sleep

# remember to input your own file path to your chrome driver here if you're using chrome
browser = webdriver.Chrome()
browser.set_window_size(414, 736)	# 375 x 667

rootURL = 'https://app.hollo.dev'
browser.get(rootURL)

username = browser.find_element_by_xpath("//input[@type='email']")
password = browser.find_element_by_xpath("//input[@type='password']")
username.send_keys('******')
password.send_keys('******')

login_button = browser.find_element_by_xpath('//button[@class="login"]')
login_button.click()
sleep(1.0)

assert browser.current_url == rootURL + '/chats'