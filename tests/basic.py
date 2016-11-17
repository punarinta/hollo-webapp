# https://christopher.su/2015/selenium-chromedriver-ubuntu/

import re
import config
from time import sleep
from selenium import webdriver

def log(text, status):
	if status == True:
		print '\033[92m[PASSED]\033[0m ' + text
	else:
		print '\033[91m[FAILED]\033[0m ' + text

def waitForElement ():
    return

# remember to input your own file path to your chrome driver here if you're using chrome
browser = webdriver.Chrome()
browser.set_window_size(414, 736)	    # 375 x 667
browser.set_window_position(610, 0)     # 1024 - W x 0

rootURL = 'https://app.hollo.dev'
browser.get(rootURL)
log('Path init to /auth/login', browser.current_url == rootURL + '/auth/login')

i_username = browser.find_element_by_css_selector("input[type='email']")
i_password = browser.find_element_by_css_selector("input[type='password']")
i_username.send_keys(config.username)
i_password.send_keys(config.password)

b_login = browser.find_element_by_css_selector('button.login')
b_login.click()
sleep(4.0)
log('Path changed to /chats', browser.current_url == rootURL + '/chats')

b_profile = browser.find_element_by_css_selector('chats-page bottom-bar bar-icon:nth-child(1)')
b_profile.click()
sleep(2.0)
log('Path changed to /profile', browser.current_url == rootURL + '/profile')

sleep(0.5)
print ''
browser.quit()
